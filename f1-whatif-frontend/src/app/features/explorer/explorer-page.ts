import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ExplorerActions } from '../../state/explorer/explorer.actions';
import { explorerFeature } from '../../state/explorer/explorer.reducer';
import {
  selectSelectedDrivers,
  selectSelectedRaces,
  selectSelectedRulesetDetail,
} from '../../state/explorer/explorer.selectors';
import { referenceFeature } from '../../state/reference/reference.reducer';
import { selectIsLoggedIn } from '../../state/auth/auth.selectors';
import { ScenariosActions } from '../../state/scenarios/scenarios.actions';
import { scenariosFeature } from '../../state/scenarios/scenarios.reducer';
import { toQueryParams } from '../../core/scenario-query';
import { rulesetForSeason } from '../../core/season-ruleset';
import { ScenarioSave, SaveRequest } from './scenario-save';
import { SettingsPanel } from './settings-panel';
import { StandingsTable } from './standings-table';

/** Connects the explorer state to the settings and the standings table. */
@Component({
  selector: 'app-explorer-page',
  imports: [SettingsPanel, StandingsTable, ScenarioSave],
  templateUrl: './explorer-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExplorerPage implements OnInit {
  private readonly store = inject(Store);

  protected readonly seasons = this.store.selectSignal(referenceFeature.selectSeasons);
  protected readonly rulesets = this.store.selectSignal(referenceFeature.selectRulesets);
  protected readonly referenceStatus = this.store.selectSignal(referenceFeature.selectStatus);
  protected readonly referenceError = this.store.selectSignal(referenceFeature.selectError);

  protected readonly season = this.store.selectSignal(explorerFeature.selectSeason);
  protected readonly rulesetCode = this.store.selectSignal(explorerFeature.selectRulesetCode);
  protected readonly includeSprints = this.store.selectSignal(explorerFeature.selectIncludeSprints);
  protected readonly countBest = this.store.selectSignal(explorerFeature.selectCountBest);
  protected readonly excludedDriverIds = this.store.selectSignal(explorerFeature.selectExcludedDriverIds);
  protected readonly excludedRounds = this.store.selectSignal(explorerFeature.selectExcludedRounds);
  protected readonly standings = this.store.selectSignal(explorerFeature.selectStandings);
  protected readonly status = this.store.selectSignal(explorerFeature.selectStatus);
  protected readonly error = this.store.selectSignal(explorerFeature.selectError);

  protected readonly activeScenario = this.store.selectSignal(explorerFeature.selectScenario);
  protected readonly loggedIn = this.store.selectSignal(selectIsLoggedIn);
  protected readonly saveStatus = this.store.selectSignal(scenariosFeature.selectSaveStatus);
  protected readonly saveError = this.store.selectSignal(scenariosFeature.selectSaveError);

  protected readonly drivers = this.store.selectSignal(selectSelectedDrivers);
  protected readonly races = this.store.selectSignal(selectSelectedRaces);
  protected readonly rulesetDetail = this.store.selectSignal(selectSelectedRulesetDetail);

  protected readonly rows = computed(() => this.standings()?.standings ?? []);
  /** The current settings as query parameters, so a driver page can show the same scenario. */
  protected readonly driverQuery = computed(() => {
    const ruleset = this.rulesetCode();
    return ruleset === null
      ? null
      : toQueryParams({
          ruleset,
          includeSprints: this.includeSprints(),
          countBest: this.countBest(),
          excludeDrivers: this.excludedDriverIds(),
          excludeRounds: this.excludedRounds(),
        });
  });
  protected readonly canSave = computed(() => this.standings() !== null && this.status() !== 'error');
  protected readonly heading = computed(() => (this.season() === null ? 'Standings' : `${this.season()} standings`));
  protected readonly subtitle = computed(() => {
    const name = this.rulesets().find((ruleset) => ruleset.code === this.rulesetCode())?.name;
    const excluded = this.excludedDriverIds().length + this.excludedRounds().length;
    const parts = [name, excluded > 0 ? `${excluded} exclusion${excluded === 1 ? '' : 's'}` : null];
    return parts.filter((part): part is string => !!part).join(' · ');
  });

  ngOnInit(): void {
    this.store.dispatch(ExplorerActions.opened());
  }

  protected retry(): void {
    this.store.dispatch(ExplorerActions.opened());
  }

  protected onSeason(year: number): void {
    this.store.dispatch(ExplorerActions.seasonChanged({ year, rulesetCode: rulesetForSeason(year, this.rulesets()) }));
  }

  protected onRuleset(code: string): void {
    this.store.dispatch(ExplorerActions.rulesetChanged({ code }));
  }

  protected onIncludeSprints(value: boolean): void {
    this.store.dispatch(ExplorerActions.includeSprintsChanged({ value }));
  }

  protected onCountBest(value: number | null): void {
    this.store.dispatch(ExplorerActions.countBestChanged({ value }));
  }

  protected onDriverToggle(driverId: number): void {
    this.store.dispatch(ExplorerActions.driverExclusionToggled({ driverId }));
  }

  protected onRoundToggle(round: number): void {
    this.store.dispatch(ExplorerActions.roundExclusionToggled({ round }));
  }

  protected onSave(request: SaveRequest): void {
    this.store.dispatch(ScenariosActions.saveRequested(request));
  }

  protected onSaveDismiss(): void {
    this.store.dispatch(ScenariosActions.saveDismissed());
  }

  protected onClearExclusions(): void {
    this.store.dispatch(ExplorerActions.exclusionsCleared());
  }
}
