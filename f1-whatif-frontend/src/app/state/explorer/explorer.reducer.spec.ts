import { StandingsResponse } from '../../core/models';
import { ReferenceActions } from '../reference/reference.actions';
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
