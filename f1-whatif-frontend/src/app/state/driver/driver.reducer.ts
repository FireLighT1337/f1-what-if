import { createFeature, createReducer, on } from '@ngrx/store';
import { DriverPhoto, DriverScenarioResponse, DriverSeasonResponse, ScenarioParams } from '../../core/models';
import { scenarioKey } from '../../core/scenario-query';
import { LoadStatus } from '../reference/reference.reducer';
import { DriverActions } from './driver.actions';

export interface DriverEntry {
  status: LoadStatus;
  data: DriverSeasonResponse | null;
  error: string | null;
}

export interface DriverScenarioEntry {
  status: LoadStatus;
  data: DriverScenarioResponse | null;
  error: string | null;
}

/** Results are kept per driver and season, so going back to a driver shows them at once. */
export interface DriverState {
  /** The driver and season the open page is about. */
  current: { year: number; driverId: number } | null;
  entries: Record<string, DriverEntry>;
  /** The scenario the open page was opened with, or null when it shows the real season only. */
  currentScenario: { year: number; driverId: number; params: ScenarioParams } | null;
  /** Scenario results, kept per season, driver and scenario settings. */
  scenarioEntries: Record<string, DriverScenarioEntry>;
  /** A photo with photoUrl null means "looked up, there is none". A missing key means "not looked up yet". */
  photos: Record<number, DriverPhoto>;
  /** Drivers whose photo is being fetched, so it is not requested twice. */
  photosRequested: number[];
}

export const initialDriverState: DriverState = {
  current: null,
  entries: {},
  currentScenario: null,
  scenarioEntries: {},
  photos: {},
  photosRequested: [],
};

export function driverKey(year: number, driverId: number): string {
  return `${year}:${driverId}`;
}

export function driverScenarioKey(year: number, driverId: number, params: ScenarioParams): string {
  return `${driverKey(year, driverId)}:${scenarioKey(params)}`;
}

export const driverFeature = createFeature({
  name: 'driver',
  reducer: createReducer(
    initialDriverState,
    on(DriverActions.pageOpened, (state, { year, driverId }) => ({
      ...state,
      current: { year, driverId },
      currentScenario: null,
    })),
    on(DriverActions.scenarioPageOpened, (state, { year, driverId, params }) => ({
      ...state,
      currentScenario: { year, driverId, params },
    })),
    on(DriverActions.scenarioResultsRequested, (state, { year, driverId, params }) => ({
      ...state,
      scenarioEntries: {
        ...state.scenarioEntries,
        [driverScenarioKey(year, driverId, params)]: { status: 'loading' as const, data: null, error: null },
      },
    })),
    on(DriverActions.scenarioResultsSucceeded, (state, { year, driverId, params, response }) => ({
      ...state,
      scenarioEntries: {
        ...state.scenarioEntries,
        [driverScenarioKey(year, driverId, params)]: { status: 'loaded' as const, data: response, error: null },
      },
    })),
    on(DriverActions.scenarioResultsFailed, (state, { year, driverId, params, error }) => ({
      ...state,
      scenarioEntries: {
        ...state.scenarioEntries,
        [driverScenarioKey(year, driverId, params)]: { status: 'error' as const, data: null, error },
      },
    })),
    on(DriverActions.resultsRequested, (state, { year, driverId }) => ({
      ...state,
      entries: {
        ...state.entries,
        [driverKey(year, driverId)]: { status: 'loading' as const, data: null, error: null },
      },
    })),
    on(DriverActions.resultsSucceeded, (state, { year, driverId, response }) => ({
      ...state,
      entries: {
        ...state.entries,
        [driverKey(year, driverId)]: { status: 'loaded' as const, data: response, error: null },
      },
    })),
    on(DriverActions.resultsFailed, (state, { year, driverId, error }) => ({
      ...state,
      entries: {
        ...state.entries,
        [driverKey(year, driverId)]: { status: 'error' as const, data: null, error },
      },
    })),
    on(DriverActions.photoRequested, (state, { driverId }) => ({
      ...state,
      photosRequested: [...state.photosRequested, driverId],
    })),
    on(DriverActions.photoLoaded, (state, { driverId, photo }) => ({
      ...state,
      photos: { ...state.photos, [driverId]: photo },
    })),
  ),
});
