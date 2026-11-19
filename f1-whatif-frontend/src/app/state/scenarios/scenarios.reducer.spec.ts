import { ScenarioResponse, StandingsResponse } from '../../core/models';
import { ScenariosActions } from './scenarios.actions';
import { ScenariosState, initialScenariosState, scenariosFeature } from './scenarios.reducer';

const reduce = scenariosFeature.reducer;

function scenario(id: number, name = `Scenario ${id}`, publicId: string | null = null): ScenarioResponse {
  return {
    id,
    name,
    seasonYear: 1984,
    rulesetCode: 'classic-1961',
    includeSprints: true,
    countBest: null,
    excludedDriverIds: [],
    excludedRounds: [],
    publicId,
    createdAt: '2026-11-18T10:00:00Z',
    updatedAt: '2026-11-18T10:00:00Z',
  };
}

const standings: StandingsResponse = { season: 1984, ruleset: 'classic-1961', standings: [] };

describe('scenarios reducer', () => {
  it('loads the list', () => {
    const loading = reduce(initialScenariosState, ScenariosActions.pageOpened());
    const loaded = reduce(loading, ScenariosActions.listLoaded({ items: [scenario(1), scenario(2)] }));

    expect(loading.listStatus).toBe('loading');
    expect(loaded.listStatus).toBe('loaded');
    expect(loaded.items.map((item) => item.id)).toEqual([1, 2]);
  });

  it('keeps the old list while it is reloaded', () => {
    const shown: ScenariosState = { ...initialScenariosState, items: [scenario(1)], listStatus: 'loaded' };

    expect(reduce(shown, ScenariosActions.pageOpened()).items).toHaveLength(1);
  });

  it('stores a list error', () => {
    const state = reduce(initialScenariosState, ScenariosActions.listFailed({ error: 'Nope' }));

    expect(state.listStatus).toBe('error');
    expect(state.listError).toBe('Nope');
  });

  it('goes through saving to saved and puts the new scenario first', () => {
    const existing: ScenariosState = { ...initialScenariosState, items: [scenario(1)] };

    const saving = reduce(existing, ScenariosActions.saveRequested({ name: 'New', updateId: null }));
    const saved = reduce(saving, ScenariosActions.saveSucceeded({ scenario: scenario(2, 'New') }));

    expect(saving.saveStatus).toBe('saving');
    expect(saved.saveStatus).toBe('saved');
    expect(saved.items.map((item) => item.id)).toEqual([2, 1]);
  });

  it('replaces an updated scenario instead of adding a copy', () => {
    const existing: ScenariosState = { ...initialScenariosState, items: [scenario(1), scenario(2)] };

    const state = reduce(existing, ScenariosActions.saveSucceeded({ scenario: scenario(2, 'Renamed') }));

    expect(state.items.map((item) => item.id)).toEqual([2, 1]);
    expect(state.items[0].name).toBe('Renamed');
  });

  it('stores a save error and can reset it', () => {
    const failed = reduce(initialScenariosState, ScenariosActions.saveFailed({ error: 'Limit reached' }));
    const reset = reduce(failed, ScenariosActions.saveDismissed());

    expect(failed.saveStatus).toBe('error');
    expect(failed.saveError).toBe('Limit reached');
    expect(reset.saveStatus).toBe('idle');
    expect(reset.saveError).toBeNull();
  });

  it('removes a deleted scenario', () => {
    const existing: ScenariosState = { ...initialScenariosState, items: [scenario(1), scenario(2)] };

    expect(reduce(existing, ScenariosActions.deleteSucceeded({ id: 1 })).items.map((item) => item.id)).toEqual([2]);
  });

  it('updates a scenario in place when sharing changes', () => {
    const existing: ScenariosState = { ...initialScenariosState, items: [scenario(1), scenario(2)] };

    const state = reduce(existing, ScenariosActions.scenarioUpdated({ scenario: scenario(2, 'Scenario 2', 'public-id') }));

    expect(state.items.map((item) => item.id)).toEqual([1, 2]);
    expect(state.items[1].publicId).toBe('public-id');
  });

  it('tracks shared scenarios by their public id', () => {
    const loading = reduce(initialScenariosState, ScenariosActions.sharedOpened({ publicId: 'abc' }));
    const loaded = reduce(
      loading,
      ScenariosActions.sharedLoaded({ publicId: 'abc', scenario: scenario(1, 'S', 'abc'), standings }),
    );
    const failed = reduce(loaded, ScenariosActions.sharedFailed({ publicId: 'xyz', error: 'Gone' }));

    expect(loading.shared['abc'].status).toBe('loading');
    expect(loaded.shared['abc']).toMatchObject({ status: 'loaded', standings });
    expect(failed.shared['xyz']).toMatchObject({ status: 'error', error: 'Gone' });
    expect(failed.shared['abc'].status).toBe('loaded');
  });
});
