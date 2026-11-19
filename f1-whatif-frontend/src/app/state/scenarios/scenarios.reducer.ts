import { createFeature, createReducer, on } from '@ngrx/store';
import { ScenarioResponse, StandingsResponse } from '../../core/models';
import { LoadStatus } from '../reference/reference.reducer';
import { ScenariosActions } from './scenarios.actions';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SharedEntry {
  status: LoadStatus;
  scenario: ScenarioResponse | null;
  standings: StandingsResponse | null;
  error: string | null;
}

export interface ScenariosState {
  items: ScenarioResponse[];
  listStatus: LoadStatus;
  /** Errors from loading the list or from deleting and sharing. */
  listError: string | null;
  saveStatus: SaveStatus;
  saveError: string | null;
  shared: Record<string, SharedEntry>;
}

export const initialScenariosState: ScenariosState = {
  items: [],
  listStatus: 'idle',
  listError: null,
  saveStatus: 'idle',
  saveError: null,
  shared: {},
};

/** Replaces the scenario with the same id, or adds it; the most recently changed one comes first. */
function upsert(items: ScenarioResponse[], scenario: ScenarioResponse): ScenarioResponse[] {
  return [scenario, ...items.filter((item) => item.id !== scenario.id)];
}

export const scenariosFeature = createFeature({
  name: 'scenarios',
  reducer: createReducer(
    initialScenariosState,
    on(ScenariosActions.pageOpened, (state) => ({ ...state, listStatus: 'loading' as const, listError: null })),
    on(ScenariosActions.listLoaded, (state, { items }) => ({
      ...state,
      items,
      listStatus: 'loaded' as const,
      listError: null,
    })),
    on(ScenariosActions.listFailed, (state, { error }) => ({ ...state, listStatus: 'error' as const, listError: error })),

    on(ScenariosActions.saveRequested, (state) => ({ ...state, saveStatus: 'saving' as const, saveError: null })),
    on(ScenariosActions.saveSucceeded, (state, { scenario }) => ({
      ...state,
      items: upsert(state.items, scenario),
      saveStatus: 'saved' as const,
      saveError: null,
    })),
    on(ScenariosActions.saveFailed, (state, { error }) => ({ ...state, saveStatus: 'error' as const, saveError: error })),
    on(ScenariosActions.saveDismissed, (state) => ({ ...state, saveStatus: 'idle' as const, saveError: null })),

    on(ScenariosActions.deleteSucceeded, (state, { id }) => ({
      ...state,
      items: state.items.filter((item) => item.id !== id),
      listError: null,
    })),
    on(ScenariosActions.scenarioUpdated, (state, { scenario }) => ({
      ...state,
      items: state.items.map((item) => (item.id === scenario.id ? scenario : item)),
      listError: null,
    })),
    on(ScenariosActions.actionFailed, (state, { error }) => ({ ...state, listError: error })),

    on(ScenariosActions.sharedOpened, (state, { publicId }) => ({
      ...state,
      shared: {
        ...state.shared,
        [publicId]: { status: 'loading' as const, scenario: null, standings: null, error: null },
      },
    })),
    on(ScenariosActions.sharedLoaded, (state, { publicId, scenario, standings }) => ({
      ...state,
      shared: { ...state.shared, [publicId]: { status: 'loaded' as const, scenario, standings, error: null } },
    })),
    on(ScenariosActions.sharedFailed, (state, { publicId, error }) => ({
      ...state,
      shared: { ...state.shared, [publicId]: { status: 'error' as const, scenario: null, standings: null, error } },
    })),
  ),
});
