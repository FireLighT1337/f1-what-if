import { DriverPhoto, DriverScenarioResponse, DriverSeasonResponse, ScenarioParams } from '../../core/models';
import { DriverActions } from './driver.actions';
import { driverFeature, driverKey, driverScenarioKey, initialDriverState } from './driver.reducer';

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

  describe('scenario results', () => {
    const params: ScenarioParams = { ruleset: 'x', includeSprints: true, countBest: null, excludeDrivers: [], excludeRounds: [3] };
    const other: ScenarioParams = { ...params, countBest: 5 };
    const scenarioResponse = {
      driver: response.driver,
      season: 1984,
      rulesetCode: 'x',
      rulesetName: 'X',
      includeSprints: true,
      countBest: null,
      summary: { rank: 2, points: 40, racesCounted: 10, wins: 1, podiums: 3 },
      races: [],
    } as DriverScenarioResponse;

    it('remembers the scenario of the open page, and forgets it when a page without one opens', () => {
      const withScenario = reduce(initialDriverState, DriverActions.scenarioPageOpened({ year: 1984, driverId: 2, params }));
      const without = reduce(withScenario, DriverActions.pageOpened({ year: 1984, driverId: 2 }));

      expect(withScenario.currentScenario).toEqual({ year: 1984, driverId: 2, params });
      expect(without.currentScenario).toBeNull();
    });

    it('marks a request as loading, then stores the result', () => {
      const key = driverScenarioKey(1984, 2, params);
      const loading = reduce(initialDriverState, DriverActions.scenarioResultsRequested({ year: 1984, driverId: 2, params }));
      const loaded = reduce(
        loading,
        DriverActions.scenarioResultsSucceeded({ year: 1984, driverId: 2, params, response: scenarioResponse }),
      );

      expect(loading.scenarioEntries[key].status).toBe('loading');
      expect(loaded.scenarioEntries[key]).toEqual({ status: 'loaded', data: scenarioResponse, error: null });
    });

    it('stores a failure without touching other scenarios or the real results', () => {
      const loaded = reduce(
        initialDriverState,
        DriverActions.scenarioResultsSucceeded({ year: 1984, driverId: 2, params: other, response: scenarioResponse }),
      );
      const failed = reduce(
        loaded,
        DriverActions.scenarioResultsFailed({ year: 1984, driverId: 2, params, error: 'This driver is excluded in the scenario.' }),
      );

      expect(failed.scenarioEntries[driverScenarioKey(1984, 2, params)]).toEqual({
        status: 'error',
        data: null,
        error: 'This driver is excluded in the scenario.',
      });
      expect(failed.scenarioEntries[driverScenarioKey(1984, 2, other)].status).toBe('loaded');
      expect(failed.entries).toEqual({});
    });
  });
});
