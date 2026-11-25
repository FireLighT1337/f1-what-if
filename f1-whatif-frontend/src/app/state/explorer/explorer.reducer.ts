import { createFeature, createReducer, on } from '@ngrx/store';
import { RulesetSummary, SeasonSummary, StandingsResponse } from '../../core/models';
import { ReferenceActions } from '../reference/reference.actions';
import { ScenariosActions } from '../scenarios/scenarios.actions';
import { LoadStatus } from '../reference/reference.reducer';
import { ExplorerActions } from './explorer.actions';

/** The points system that is selected first, if the backend offers it. */
export const DEFAULT_RULESET = 'current-2025';

/** The saved scenario that the current settings came from, so it can be updated. */
export interface ActiveScenario {
  id: number;
  name: string;
}

/** What the user has chosen, plus the standings calculated for it. */
export interface ExplorerState {
  season: number | null;
  rulesetCode: string | null;
  includeSprints: boolean;
  /** Only the best N round totals count; null means every round counts. */
  countBest: number | null;
  excludedDriverIds: number[];
  /** Races are excluded by round number, which is also how saved scenarios refer to them. */
  excludedRounds: number[];
  scenario: ActiveScenario | null;
  standings: StandingsResponse | null;
  status: LoadStatus;
  error: string | null;
}

export const initialExplorerState: ExplorerState = {
  season: null,
  rulesetCode: null,
  includeSprints: true,
  countBest: null,
  excludedDriverIds: [],
  excludedRounds: [],
  scenario: null,
  standings: null,
  status: 'idle',
  error: null,
};

/** The newest season and the default points system (or the first one offered); null where there is none. */
function pickDefaults(
  seasons: SeasonSummary[],
  rulesets: RulesetSummary[],
): { season: number | null; rulesetCode: string | null } {
  return {
    season: seasons[0]?.year ?? null,
    rulesetCode: (rulesets.find((r) => r.code === DEFAULT_RULESET) ?? rulesets[0])?.code ?? null,
  };
}

const recalculating = { status: 'loading' as const, error: null };

function toggle<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items.filter((existing) => existing !== item) : [...items, item];
}

export const explorerFeature = createFeature({
  name: 'explorer',
  reducer: createReducer(
    initialExplorerState,
    on(ReferenceActions.initialLoadSucceeded, (state, { seasons, rulesets }) => {
      const defaults = pickDefaults(seasons, rulesets);
      return {
        ...state,
        season: state.season ?? defaults.season,
        rulesetCode: state.rulesetCode ?? defaults.rulesetCode,
        ...recalculating,
      };
    }),
    // Back to a fresh explorer. Without any season there is nothing to calculate, so it stays idle.
    on(ExplorerActions.defaultsRestored, (_state, { seasons, rulesets }) => {
      const defaults = pickDefaults(seasons, rulesets);
      return defaults.season === null || defaults.rulesetCode === null
        ? { ...initialExplorerState }
        : { ...initialExplorerState, ...defaults, ...recalculating };
    }),
    // Drivers and rounds belong to one season, so changing the season clears them; the points system follows the season.
    on(ExplorerActions.seasonChanged, (state, { year, rulesetCode }) => ({
      ...state,
      season: year,
      rulesetCode: rulesetCode ?? state.rulesetCode,
      excludedDriverIds: [],
      excludedRounds: [],
      ...recalculating,
    })),
    on(ExplorerActions.rulesetChanged, (state, { code }) => ({ ...state, rulesetCode: code, ...recalculating })),
    on(ExplorerActions.includeSprintsChanged, (state, { value }) => ({
      ...state,
      includeSprints: value,
      ...recalculating,
    })),
    on(ExplorerActions.countBestChanged, (state, { value }) => ({ ...state, countBest: value, ...recalculating })),
    on(ExplorerActions.driverExclusionToggled, (state, { driverId }) => ({
      ...state,
      excludedDriverIds: toggle(state.excludedDriverIds, driverId),
      ...recalculating,
    })),
    on(ExplorerActions.roundExclusionToggled, (state, { round }) => ({
      ...state,
      excludedRounds: toggle(state.excludedRounds, round),
      ...recalculating,
    })),
    on(ExplorerActions.exclusionsCleared, (state) => ({
      ...state,
      excludedDriverIds: [],
      excludedRounds: [],
      ...recalculating,
    })),
    on(ExplorerActions.scenarioOpened, (state, { scenario, owned }) => ({
      ...state,
      season: scenario.seasonYear,
      rulesetCode: scenario.rulesetCode,
      includeSprints: scenario.includeSprints,
      countBest: scenario.countBest,
      excludedDriverIds: [...scenario.excludedDriverIds],
      excludedRounds: [...scenario.excludedRounds],
      scenario: owned ? { id: scenario.id, name: scenario.name } : null,
      ...recalculating,
    })),
    on(ScenariosActions.saveSucceeded, (state, { scenario }) => ({
      ...state,
      scenario: { id: scenario.id, name: scenario.name },
    })),
    on(ScenariosActions.deleteSucceeded, (state, { id }) => ({
      ...state,
      scenario: state.scenario?.id === id ? null : state.scenario,
    })),
    // Without the races of the season the exclusions cannot be applied, so there is nothing to show.
    on(ReferenceActions.seasonDataFailed, (state, { error }) => ({ ...state, status: 'error' as const, error })),
    on(ExplorerActions.standingsSucceeded, (state, { response }) => ({
      ...state,
      standings: response,
      status: 'loaded' as const,
      error: null,
    })),
    on(ExplorerActions.standingsFailed, (state, { error }) => ({ ...state, status: 'error' as const, error })),
  ),
});
