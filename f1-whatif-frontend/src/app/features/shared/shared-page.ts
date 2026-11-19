import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ExplorerActions } from '../../state/explorer/explorer.actions';
import { ReferenceActions } from '../../state/reference/reference.actions';
import { referenceFeature } from '../../state/reference/reference.reducer';
import { ScenariosActions } from '../../state/scenarios/scenarios.actions';
import { scenariosFeature } from '../../state/scenarios/scenarios.reducer';
import { StandingsTable } from '../explorer/standings-table';
import { describeScenario } from '../scenarios/describe-scenario';

/** A scenario that someone shared with a link: read-only, no login needed. */
@Component({
  selector: 'app-shared-page',
  imports: [RouterLink, StandingsTable],
  templateUrl: './shared-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedPage {
  /** From the address (/shared/:publicId), bound by the router. */
  readonly publicId = input.required<string>();

  private readonly store = inject(Store);
  private readonly router = inject(Router);

  private readonly shared = this.store.selectSignal(scenariosFeature.selectShared);
  private readonly rulesets = this.store.selectSignal(referenceFeature.selectRulesets);

  protected readonly entry = computed(() => this.shared()[this.publicId()] ?? null);
  protected readonly scenario = computed(() => this.entry()?.scenario ?? null);
  protected readonly rows = computed(() => this.entry()?.standings?.standings ?? []);
  protected readonly summary = computed(() => {
    const scenario = this.scenario();
    return scenario === null ? '' : describeScenario(scenario, this.rulesets());
  });

  constructor() {
    effect(() => {
      const publicId = this.publicId();
      this.store.dispatch(ReferenceActions.rulesetsNeeded());
      this.store.dispatch(ScenariosActions.sharedOpened({ publicId }));
    });
  }

  /** Copies the settings into the explorer, where they can be changed; saving them needs an account. */
  protected openInExplorer(): void {
    const scenario = this.scenario();
    if (scenario !== null) {
      this.store.dispatch(ExplorerActions.scenarioOpened({ scenario, owned: false }));
      void this.router.navigateByUrl('/explorer');
    }
  }
}
