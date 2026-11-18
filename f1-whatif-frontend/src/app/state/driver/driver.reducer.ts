import { createFeature, createReducer, on } from '@ngrx/store';
import { DriverPhoto, DriverSeasonResponse } from '../../core/models';
import { LoadStatus } from '../reference/reference.reducer';
import { DriverActions } from './driver.actions';

export interface DriverEntry {
  status: LoadStatus;
  data: DriverSeasonResponse | null;
  error: string | null;
}

/** Results are kept per driver and season, so going back to a driver shows them at once. */
export interface DriverState {
  /** The driver and season the open page is about. */
  current: { year: number; driverId: number } | null;
  entries: Record<string, DriverEntry>;
  /** A photo with photoUrl null means "looked up, there is none". A missing key means "not looked up yet". */
  photos: Record<number, DriverPhoto>;
  /** Drivers whose photo is being fetched, so it is not requested twice. */
  photosRequested: number[];
}

export const initialDriverState: DriverState = {
  current: null,
  entries: {},
  photos: {},
  photosRequested: [],
};

export function driverKey(year: number, driverId: number): string {
  return `${year}:${driverId}`;
}

export const driverFeature = createFeature({
  name: 'driver',
  reducer: createReducer(
    initialDriverState,
    on(DriverActions.pageOpened, (state, { year, driverId }) => ({ ...state, current: { year, driverId } })),
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
