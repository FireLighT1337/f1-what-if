import { createFeature, createReducer, on } from '@ngrx/store';
import { RaceInfo, RulesetDetail, RulesetSummary, SeasonDriver, SeasonSummary } from '../../core/models';
import { ReferenceActions } from './reference.actions';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** Lists that rarely change: seasons, points systems, and per-season races and drivers. */
export interface ReferenceState {
  seasons: SeasonSummary[];
  rulesets: RulesetSummary[];
  racesBySeason: Record<number, RaceInfo[]>;
  driversBySeason: Record<number, SeasonDriver[]>;
  rulesetDetails: Record<string, RulesetDetail>;
  status: LoadStatus;
  error: string | null;
}

export const initialReferenceState: ReferenceState = {
  seasons: [],
  rulesets: [],
  racesBySeason: {},
  driversBySeason: {},
  rulesetDetails: {},
  status: 'idle',
  error: null,
};

export const referenceFeature = createFeature({
  name: 'reference',
  reducer: createReducer(
    initialReferenceState,
    on(ReferenceActions.initialLoadRequested, (state) => ({ ...state, status: 'loading' as const, error: null })),
    on(ReferenceActions.initialLoadSucceeded, (state, { seasons, rulesets }) => ({
      ...state,
      seasons,
      rulesets,
      status: 'loaded' as const,
      error: null,
    })),
    on(ReferenceActions.initialLoadFailed, (state, { error }) => ({ ...state, status: 'error' as const, error })),
    on(ReferenceActions.seasonDataSucceeded, (state, { year, races, drivers }) => ({
      ...state,
      racesBySeason: { ...state.racesBySeason, [year]: races },
      driversBySeason: { ...state.driversBySeason, [year]: drivers },
    })),
    on(ReferenceActions.seasonDataFailed, ReferenceActions.rulesetDetailFailed, (state, { error }) => ({
      ...state,
      error,
    })),
    on(ReferenceActions.rulesetDetailSucceeded, (state, { detail }) => ({
      ...state,
      rulesetDetails: { ...state.rulesetDetails, [detail.code]: detail },
    })),
  ),
});
