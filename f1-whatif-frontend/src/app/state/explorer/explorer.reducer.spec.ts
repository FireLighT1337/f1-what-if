import { StandingsResponse } from '../../core/models';
import { ReferenceActions } from '../reference/reference.actions';
import { ScenariosActions } from '../scenarios/scenarios.actions';
import { ExplorerActions } from './explorer.actions';
import { DEFAULT_RULESET, ExplorerState, explorerFeature, initialExplorerState } from './explorer.reducer';

const reduce = explorerFeature.reducer;

const seasons = [
  { year: 2026, raceCount: 24, sprintRaceCount: 6 },
  { year: 2025, raceCount: 24, sprintRaceCount: 6 },
];
const rulesets = [
  { code: 'classic-1961', name: '1961-1990', description: '' },
  { code: DEFAULT_RULESET, name: 'Current', description: '' },
];

const response: StandingsResponse = {
  season: 2026,
  ruleset: DEFAULT_RULESET,
  standings: [{ rank: 1, driverId: 1, driver: 'A', points: 10, actualRank: 1, positionChange: 0 }],
};

describe('explorer reducer', () => {
  it('selects the newest season and the default points system once the lists are loaded', () => {
    const state = reduce(initialExplorerState, ReferenceActions.initialLoadSucceeded({ seasons, rulesets }));

    expect(state.season).toBe(2026);
    expect(state.rulesetCode).toBe(DEFAULT_RULESET);
    expect(state.status).toBe('loading');
  });

  it('falls back to the first points system when the default is not offered', () => {
    const state = reduce(
      initialExplorerState,
      ReferenceActions.initialLoadSucceeded({ seasons, rulesets: [rulesets[0]] }),
    );

    expect(state.rulesetCode).toBe('classic-1961');
  });

  it('keeps an existing selection when the lists are loaded again', () => {
    const chosen: ExplorerState = { ...initialExplorerState, season: 1984, rulesetCode: 'classic-1961' };

    const state = reduce(chosen, ReferenceActions.initialLoadSucceeded({ seasons, rulesets }));

    expect(state.season).toBe(1984);
    expect(state.rulesetCode).toBe('classic-1961');
  });

  it('clears the exclusions when the season changes, because they belong to one season', () => {
    const chosen: ExplorerState = { ...initialExplorerState, excludedDriverIds: [1, 2], excludedRounds: [3] };

    const state = reduce(chosen, ExplorerActions.seasonChanged({ year: 1984 }));

    expect(state.season).toBe(1984);
    expect(state.excludedDriverIds).toEqual([]);
    expect(state.excludedRounds).toEqual([]);
  });

  it('toggles a driver exclusion on and off', () => {
    const on = reduce(initialExplorerState, ExplorerActions.driverExclusionToggled({ driverId: 7 }));
    const off = reduce(on, ExplorerActions.driverExclusionToggled({ driverId: 7 }));

    expect(on.excludedDriverIds).toEqual([7]);
    expect(off.excludedDriverIds).toEqual([]);
  });

  it('toggles a round exclusion on and off', () => {
    const on = reduce(initialExplorerState, ExplorerActions.roundExclusionToggled({ round: 6 }));
    const off = reduce(on, ExplorerActions.roundExclusionToggled({ round: 6 }));

    expect(on.excludedRounds).toEqual([6]);
    expect(off.excludedRounds).toEqual([]);
  });

  it('clears all exclusions at once', () => {
    const chosen: ExplorerState = { ...initialExplorerState, excludedDriverIds: [1], excludedRounds: [2] };

    const state = reduce(chosen, ExplorerActions.exclusionsCleared());

    expect(state.excludedDriverIds).toEqual([]);
    expect(state.excludedRounds).toEqual([]);
  });

  it('shows the loading state while recalculating but keeps the previous standings', () => {
    const shown: ExplorerState = { ...initialExplorerState, standings: response, status: 'loaded' };

    const state = reduce(shown, ExplorerActions.countBestChanged({ value: 11 }));

    expect(state.countBest).toBe(11);
    expect(state.status).toBe('loading');
    expect(state.standings).toBe(response);
  });

  it('stores new standings and clears an earlier error', () => {
    const failed: ExplorerState = { ...initialExplorerState, status: 'error', error: 'Boom' };

    const state = reduce(failed, ExplorerActions.standingsSucceeded({ response }));

    expect(state.standings).toBe(response);
    expect(state.status).toBe('loaded');
    expect(state.error).toBeNull();
  });

  it('stores the error when the standings cannot be loaded', () => {
    const state = reduce(initialExplorerState, ExplorerActions.standingsFailed({ error: 'No data found.' }));

    expect(state.status).toBe('error');
    expect(state.error).toBe('No data found.');
  });
});

describe('explorer reducer with saved scenarios', () => {
  const scenario = {
    id: 7,
    name: 'No Monaco',
    seasonYear: 1984,
    rulesetCode: 'classic-1961',
    includeSprints: false,
    countBest: 11,
    excludedDriverIds: [3],
    excludedRounds: [6],
    publicId: null,
    createdAt: '2026-11-18T10:00:00Z',
    updatedAt: '2026-11-18T10:00:00Z',
  };

  it('loads all settings of a scenario and remembers it as the active one', () => {
    const state = reduce(initialExplorerState, ExplorerActions.scenarioOpened({ scenario, owned: true }));

    expect(state).toMatchObject({
      season: 1984,
      rulesetCode: 'classic-1961',
      includeSprints: false,
      countBest: 11,
      excludedDriverIds: [3],
      excludedRounds: [6],
      scenario: { id: 7, name: 'No Monaco' },
      status: 'loading',
    });
  });

  it('does not make a shared scenario the active one, because it belongs to someone else', () => {
    const state = reduce(initialExplorerState, ExplorerActions.scenarioOpened({ scenario, owned: false }));

    expect(state.scenario).toBeNull();
    expect(state.season).toBe(1984);
  });

  it('copies the exclusions instead of sharing the arrays', () => {
    const state = reduce(initialExplorerState, ExplorerActions.scenarioOpened({ scenario, owned: true }));

    expect(state.excludedDriverIds).not.toBe(scenario.excludedDriverIds);
  });

  it('keeps the active scenario while the settings are changed', () => {
    const opened = reduce(initialExplorerState, ExplorerActions.scenarioOpened({ scenario, owned: true }));

    const changed = reduce(opened, ExplorerActions.countBestChanged({ value: 9 }));

    expect(changed.scenario).toEqual({ id: 7, name: 'No Monaco' });
  });

  it('makes a newly saved scenario the active one', () => {
    const state = reduce(initialExplorerState, ScenariosActions.saveSucceeded({ scenario }));

    expect(state.scenario).toEqual({ id: 7, name: 'No Monaco' });
  });

  it('lets go of the active scenario when it is deleted, but not of another one', () => {
    const active = reduce(initialExplorerState, ScenariosActions.saveSucceeded({ scenario }));

    expect(reduce(active, ScenariosActions.deleteSucceeded({ id: 7 })).scenario).toBeNull();
    expect(reduce(active, ScenariosActions.deleteSucceeded({ id: 8 })).scenario).toEqual({ id: 7, name: 'No Monaco' });
  });

  it('shows an error when the races of the selected season cannot be loaded', () => {
    const state = reduce(initialExplorerState, ReferenceActions.seasonDataFailed({ year: 1984, error: 'Cannot reach the server.' }));

    expect(state.status).toBe('error');
    expect(state.error).toBe('Cannot reach the server.');
  });

  describe('defaultsRestored', () => {
    it('resets every choice to the newest season and the default points system', () => {
      const chosen: ExplorerState = {
        ...initialExplorerState,
        season: 1984,
        rulesetCode: 'classic-1961',
        includeSprints: false,
        countBest: 11,
        excludedDriverIds: [1],
        excludedRounds: [2],
        scenario: { id: 5, name: 'Mine' },
        standings: response,
        status: 'loaded',
      };

      const state = reduce(chosen, ExplorerActions.defaultsRestored({ seasons, rulesets }));

      expect(state).toEqual({
        ...initialExplorerState,
        season: 2026,
        rulesetCode: DEFAULT_RULESET,
        status: 'loading',
      });
    });

    it('falls back to the first points system when the default is not offered', () => {
      const state = reduce(
        initialExplorerState,
        ExplorerActions.defaultsRestored({ seasons, rulesets: [rulesets[0]] }),
      );

      expect(state.rulesetCode).toBe('classic-1961');
    });

    it('stays idle when there are no seasons yet', () => {
      const chosen: ExplorerState = { ...initialExplorerState, excludedRounds: [2], status: 'loaded' };

      const state = reduce(chosen, ExplorerActions.defaultsRestored({ seasons: [], rulesets: [] }));

      expect(state).toEqual(initialExplorerState);
    });
  });
});
