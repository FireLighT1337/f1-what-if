import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { fromQueryParams } from '../../core/scenario-query';
import { ReferenceActions } from '../../state/reference/reference.actions';
import { referenceFeature } from '../../state/reference/reference.reducer';
import { describeScenario } from '../scenarios/describe-scenario';
import { DriverActions } from '../../state/driver/driver.actions';
import { selectCurrentEntry, selectCurrentPhoto, selectCurrentScenarioEntry } from '../../state/driver/driver.selectors';
import { finishClass, finishDescription, finishLabel, initials } from './finish-label';

/** How one driver finished every race of a season, with a photo when one is available. */
@Component({
  selector: 'app-driver-page',
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './driver-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverPage {
  /** Both come from the address (/seasons/:year/drivers/:driverId), bound by the router. */
  readonly year = input.required<string>();
  readonly driverId = input.required<string>();

  /** The what-if settings, when the page is opened from a scenario; bound from the query parameters. */
  readonly ruleset = input<string>();
  readonly includeSprints = input<string>();
  readonly countBest = input<string>();
  readonly excludeDrivers = input<string>();
  readonly excludeRounds = input<string>();

  private readonly store = inject(Store);

  protected readonly entry = this.store.selectSignal(selectCurrentEntry);
  protected readonly photo = this.store.selectSignal(selectCurrentPhoto);

  protected readonly scenarioEntry = this.store.selectSignal(selectCurrentScenarioEntry);
  private readonly rulesets = this.store.selectSignal(referenceFeature.selectRulesets);

  protected readonly scenarioParams = computed(() =>
    fromQueryParams({
      ruleset: this.ruleset(),
      includeSprints: this.includeSprints(),
      countBest: this.countBest(),
      excludeDrivers: this.excludeDrivers(),
      excludeRounds: this.excludeRounds(),
    }),
  );
  /** Which results the table shows, when there is a scenario to choose from. */
  protected readonly view = signal<'scenario' | 'real'>('scenario');
  protected readonly scenario = computed(() => this.scenarioEntry()?.data ?? null);
  protected readonly scenarioError = computed(() => this.scenarioEntry()?.error ?? null);
  protected readonly scenarioLoading = computed(
    () => this.scenarioParams() !== null && this.scenario() === null && this.scenarioError() === null,
  );
  /** True while the table and the cards show the scenario; the real season is the fallback. */
  protected readonly showScenario = computed(() => this.scenario() !== null && this.view() === 'scenario');
  protected readonly scenarioSummary = computed(() => {
    const params = this.scenarioParams();
    return params === null
      ? ''
      : describeScenario(
          {
            seasonYear: Number(this.year()),
            rulesetCode: params.ruleset,
            includeSprints: params.includeSprints,
            countBest: params.countBest,
            excludedDriverIds: params.excludeDrivers,
            excludedRounds: params.excludeRounds,
          },
          this.rulesets(),
        );
  });
  protected readonly scenarioHasSprints = computed(
    () => this.scenario()?.races.some((race) => race.sprint !== null) ?? false,
  );

  protected readonly data = computed(() => this.entry()?.data ?? null);
  protected readonly invalidAddress = computed(
    () => !Number.isInteger(Number(this.year())) || !Number.isInteger(Number(this.driverId())),
  );
  protected readonly hasSprints = computed(() => this.data()?.races.some((race) => race.sprint !== null) ?? false);
  protected readonly initials = computed(() => initials(this.data()?.driver.name ?? ''));

  protected readonly finishLabel = finishLabel;
  protected readonly finishDescription = finishDescription;
  protected readonly finishClass = finishClass;

  constructor() {
    effect(() => {
      if (!this.invalidAddress()) {
        const year = Number(this.year());
        const driverId = Number(this.driverId());
        const params = this.scenarioParams();
        this.store.dispatch(DriverActions.pageOpened({ year, driverId }));
        if (params !== null) {
          this.view.set('scenario');
          this.store.dispatch(ReferenceActions.rulesetsNeeded());
          this.store.dispatch(DriverActions.scenarioPageOpened({ year, driverId, params }));
        }
      }
    });
  }

  protected retry(): void {
    const year = Number(this.year());
    const driverId = Number(this.driverId());
    this.store.dispatch(DriverActions.pageOpened({ year, driverId }));
    const params = this.scenarioParams();
    if (params !== null) {
      this.store.dispatch(DriverActions.scenarioPageOpened({ year, driverId, params }));
    }
  }

  protected retryScenario(): void {
    const params = this.scenarioParams();
    if (params !== null) {
      this.store.dispatch(
        DriverActions.scenarioPageOpened({ year: Number(this.year()), driverId: Number(this.driverId()), params }),
      );
    }
  }

  /** A position, or a short code such as Ret or DSQ when there is none. */
  protected positionLabel(position: number | null, text: string | null): string {
    return finishLabel({ entered: true, finishPosition: position, positionText: text });
  }
}
