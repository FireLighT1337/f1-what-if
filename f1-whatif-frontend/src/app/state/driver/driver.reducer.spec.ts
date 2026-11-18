import { DriverPhoto, DriverSeasonResponse } from '../../core/models';
import { DriverActions } from './driver.actions';
import { driverFeature, driverKey, initialDriverState } from './driver.reducer';

const reduce = driverFeature.reducer;

const response: DriverSeasonResponse = {
  driver: { id: 2, name: 'Alain Prost', code: 'PRO', nationality: 'French', dateOfBirth: '1955-02-24', wikipediaUrl: null },
  season: 1984,
  summary: { racesEntered: 1, wins: 1, podiums: 1, points: 9 },
  races: [],
};
const photo: DriverPhoto = { photoUrl: 'https://x/y.jpg', sourceUrl: 'https://x', articleUrl: 'https://y', width: 320, height: 400 };

describe('driver reducer', () => {
  it('remembers which driver page is open', () => {
    const state = reduce(initialDriverState, DriverActions.pageOpened({ year: 1984, driverId: 2 }));

    expect(state.current).toEqual({ year: 1984, driverId: 2 });
  });

  it('marks a request as loading, then stores the result', () => {
    const loading = reduce(initialDriverState, DriverActions.resultsRequested({ year: 1984, driverId: 2 }));
    const loaded = reduce(loading, DriverActions.resultsSucceeded({ year: 1984, driverId: 2, response }));

    expect(loading.entries[driverKey(1984, 2)].status).toBe('loading');
    expect(loaded.entries[driverKey(1984, 2)]).toEqual({ status: 'loaded', data: response, error: null });
  });

  it('stores an error for that driver and season only', () => {
    const state = reduce(initialDriverState, DriverActions.resultsFailed({ year: 1984, driverId: 2, error: 'Nope' }));

    expect(state.entries[driverKey(1984, 2)]).toEqual({ status: 'error', data: null, error: 'Nope' });
    expect(state.entries[driverKey(1983, 2)]).toBeUndefined();
  });

  it('keeps the results of different seasons apart', () => {
    let state = reduce(initialDriverState, DriverActions.resultsSucceeded({ year: 1984, driverId: 2, response }));
    state = reduce(state, DriverActions.resultsSucceeded({ year: 1985, driverId: 2, response: { ...response, season: 1985 } }));

    expect(state.entries[driverKey(1984, 2)].data?.season).toBe(1984);
    expect(state.entries[driverKey(1985, 2)].data?.season).toBe(1985);
  });

  it('records that a photo is being fetched and stores it when it arrives', () => {
    const requested = reduce(initialDriverState, DriverActions.photoRequested({ driverId: 2 }));
    const loaded = reduce(requested, DriverActions.photoLoaded({ driverId: 2, photo }));

    expect(requested.photosRequested).toEqual([2]);
    expect(loaded.photos[2]).toBe(photo);
  });
});
