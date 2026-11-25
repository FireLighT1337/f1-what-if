import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RaceInfo, RulesetDetail, RulesetSummary, SeasonDriver, SeasonSummary, ShortenedPolicy } from '../../core/models';

const POLICY_TEXT: Record<ShortenedPolicy, string> = {
  NONE: 'Races that ended early pay full points.',
  HALF_1980: 'Races that ended early pay half points below 75% of the distance, and nothing under two laps.',
  TIERED_2022: 'Races that ended early use reduced points tables below 25%, 50% and 75% of the distance.',
};

type CountingMode = 'season' | 'all' | 'best';

/** 1 -> "1st", 2 -> "2nd", 11 -> "11th". */
export function ordinal(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) {
    return `${n}th`;
  }
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** The controls for one scenario. Shows what it is given and reports changes; it holds no state itself. */
@Component({
  selector: 'app-settings-panel',
  templateUrl: './settings-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPanel {
  readonly seasons = input.required<SeasonSummary[]>();
  readonly rulesets = input.required<RulesetSummary[]>();
  readonly rulesetDetail = input<RulesetDetail | null>(null);
  readonly drivers = input<SeasonDriver[]>([]);
  readonly races = input<RaceInfo[]>([]);
  readonly season = input<number | null>(null);
  readonly rulesetCode = input<string | null>(null);
  readonly includeSprints = input(true);
  readonly countBest = input<number | null>(null);
  readonly excludedDriverIds = input<number[]>([]);
  readonly excludedRounds = input<number[]>([]);

  readonly seasonChange = output<number>();
  readonly rulesetChange = output<string>();
  readonly includeSprintsChange = output<boolean>();
  readonly countBestChange = output<number | null>();

  /** null = the season's own rule, 0 = all results, N = best N results. */
  protected readonly countingMode = computed<CountingMode>(() => {
    const value = this.countBest();
    return value === null ? 'season' : value === 0 ? 'all' : 'best';
  });
  readonly driverToggle = output<number>();
  readonly roundToggle = output<number>();
  readonly exclusionsClear = output<void>();

  protected readonly driverFilter = signal('');

  protected readonly hasSprints = computed(() => this.races().some((race) => race.hasSprint));
  protected readonly hasExclusions = computed(
    () => this.excludedDriverIds().length + this.excludedRounds().length > 0,
  );

  protected readonly filteredDrivers = computed(() => {
    const query = this.driverFilter().trim().toLowerCase();
    if (query === '') {
      return this.drivers();
    }
    return this.drivers().filter(
      (driver) =>
        driver.name.toLowerCase().includes(query) || driver.teams.some((team) => team.toLowerCase().includes(query)),
    );
  });

  protected readonly racePoints = computed(() => this.pointsList(this.rulesetDetail()?.racePoints));
  protected readonly sprintPoints = computed(() => this.pointsList(this.rulesetDetail()?.sprintPoints));
  protected readonly policyText = computed(() => {
    const detail = this.rulesetDetail();
    return detail === null ? '' : POLICY_TEXT[detail.shortenedPolicy];
  });
  protected readonly selectedRulesetDescription = computed(
    () => this.rulesets().find((ruleset) => ruleset.code === this.rulesetCode())?.description ?? '',
  );

  private pointsList(points: Record<string, number> | undefined): { label: string; points: number }[] {
    if (!points) {
      return [];
    }
    return Object.entries(points)
      .map(([position, value]) => ({ position: Number(position), points: value }))
      .sort((a, b) => a.position - b.position)
      .map((entry) => ({ label: ordinal(entry.position), points: entry.points }));
  }

  protected onSeason(event: Event): void {
    this.seasonChange.emit(Number((event.target as HTMLSelectElement).value));
  }

  protected onRuleset(event: Event): void {
    this.rulesetChange.emit((event.target as HTMLSelectElement).value);
  }

  protected onSprints(event: Event): void {
    this.includeSprintsChange.emit((event.target as HTMLInputElement).checked);
  }

  protected onCountingMode(mode: CountingMode): void {
    if (mode === 'season') {
      this.countBestChange.emit(null);
    } else if (mode === 'all') {
      this.countBestChange.emit(0);
    } else {
      // Start by ignoring each driver's two worst rounds, which is easy to adjust afterwards.
      this.countBestChange.emit(Math.max(1, this.races().length - 2));
    }
  }

  protected onBestValue(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isInteger(value) || value < 1) {
      return;
    }
    const max = this.races().length;
    this.countBestChange.emit(max > 0 ? Math.min(value, max) : value);
  }

  protected onDriverFilter(event: Event): void {
    this.driverFilter.set((event.target as HTMLInputElement).value);
  }
}
