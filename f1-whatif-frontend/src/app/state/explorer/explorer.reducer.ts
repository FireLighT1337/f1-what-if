import { createFeature, createReducer, on } from '@ngrx/store';
import { StandingsResponse } from '../../core/models';
import { ReferenceActions } from '../reference/reference.actions';
import { LoadStatus } from '../reference/reference.reducer';
import { ExplorerActions } from './explorer.actions';

/** The points system that is selected first, if the backend offers it. */
export const DEFAULT_RULESET = 'current-2025';

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
  standings: null,
  status: 'idle',
  error: null,
};

const recalculating = { status: 'loading' as const, error: null };

function toggle<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items.filter((existing) => existing !== item) : [...items, item];
}

export const explorerFeature = createFeature({
  name: 'explorer',
  reducer: createReducer(
    initialExplorerState,
    on(ReferenceActions.initialLoadSucceeded, (state, { seasons, rulesets }) => ({
      ...state,
      season: state.season ?? seasons[0]?.year ?? null,
      rulesetCode:
        state.rulesetCode ?? (rulesets.find((r) => r.code === DEFAULT_RULESET) ?? rulesets[0])?.code ?? null,
      ...recalculating,
    })),
    // Drivers and rounds belong to one season, so changing the season clears them.
    on(ExplorerActions.seasonChanged, (state, { year }) => ({
      ...state,
      season: year,
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
    on(ExplorerActions.standingsSucceeded, (state, { response }) => ({
      ...state,
      standings: response,
      status: 'loaded' as const,
      error: null,
    })),
    on(ExplorerActions.standingsFailed, (state, { error }) => ({ ...state, status: 'error' as const, error })),
  ),
});
