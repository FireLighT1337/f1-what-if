import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Subject, of, throwError } from 'rxjs';
import { ScenarioRequest, ScenarioResponse, StandingsResponse } from '../../core/models';
import { ScenarioApi } from '../../core/scenario-api';
import { selectScenarioDraft } from '../explorer/explorer.selectors';
import { ScenariosActions } from './scenarios.actions';
import { ScenariosEffects } from './scenarios.effects';

const draft: Omit<ScenarioRequest, 'name'> = {
  seasonYear: 1984,
  rulesetCode: 'classic-1961',
  includeSprints: true,
  countBest: 11,
  excludedDriverIds: [3],
  excludedRounds: [6],
};

const saved: ScenarioResponse = {
  ...draft,
  id: 7,
  name: 'No Monaco',
  publicId: null,
  createdAt: '2026-11-18T10:00:00Z',
  updatedAt: '2026-11-18T10:00:00Z',
};
const standings: StandingsResponse = { season: 1984, ruleset: 'classic-1961', standings: [] };

describe('ScenariosEffects', () => {
  // Selector overrides live on module-level selectors; without a reset they leak into other spec files.
  afterEach(() => TestBed.inject(MockStore).resetSelectors());
  let actions$: Subject<Action>;
  let api: Record<'list' | 'create' | 'update' | 'delete' | 'share' | 'unshare' | 'shared' | 'sharedStandings', ReturnType<typeof vi.fn>>;

  function setup(selectedDraft: typeof draft | null = draft): ScenariosEffects {
    actions$ = new Subject<Action>();
    api = {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      share: vi.fn(),
      unshare: vi.fn(),
      shared: vi.fn(),
      sharedStandings: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        ScenariosEffects,
        provideMockActions(() => actions$),
        provideMockStore({ selectors: [{ selector: selectScenarioDraft, value: selectedDraft }] }),
        { provide: ScenarioApi, useValue: api },
      ],
    });
    return TestBed.inject(ScenariosEffects);
  }

  function collect(effect$: { subscribe(next: (action: Action) => void): unknown }): Action[] {
    const emitted: Action[] = [];
    effect$.subscribe((action) => emitted.push(action));
    return emitted;
  }

  it('loads the list', () => {
    const effects = setup();
    api.list.mockReturnValue(of([saved]));
    const emitted = collect(effects.loadList$);

    actions$.next(ScenariosActions.pageOpened());

    expect(emitted).toEqual([ScenariosActions.listLoaded({ items: [saved] })]);
  });

  it('reports a list that cannot be loaded', () => {
    const effects = setup();
    api.list.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const emitted = collect(effects.loadList$);

    actions$.next(ScenariosActions.pageOpened());

    expect(emitted).toHaveLength(1);
    expect(emitted[0].type).toBe(ScenariosActions.listFailed.type);
  });

  it('saves the current selection as a new scenario', () => {
    const effects = setup();
    api.create.mockReturnValue(of(saved));
    const emitted = collect(effects.save$);

    actions$.next(ScenariosActions.saveRequested({ name: 'No Monaco', updateId: null }));

    expect(api.create).toHaveBeenCalledWith({ ...draft, name: 'No Monaco' });
    expect(api.update).not.toHaveBeenCalled();
    expect(emitted).toEqual([ScenariosActions.saveSucceeded({ scenario: saved })]);
  });

  it('overwrites an existing scenario when asked to update', () => {
    const effects = setup();
    api.update.mockReturnValue(of(saved));
    const emitted = collect(effects.save$);

    actions$.next(ScenariosActions.saveRequested({ name: 'No Monaco', updateId: 7 }));

    expect(api.update).toHaveBeenCalledWith(7, { ...draft, name: 'No Monaco' });
    expect(api.create).not.toHaveBeenCalled();
    expect(emitted).toEqual([ScenariosActions.saveSucceeded({ scenario: saved })]);
  });

  it('explains that the limit of saved scenarios was reached', () => {
    const effects = setup();
    api.create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    const emitted = collect(effects.save$);

    actions$.next(ScenariosActions.saveRequested({ name: 'One more', updateId: null }));

    const action = emitted[0] as ReturnType<typeof ScenariosActions.saveFailed>;
    expect(action.error).toContain('limit of 50');
  });

  it('does not save while no season and points system are selected', () => {
    const effects = setup(null);
    const emitted = collect(effects.save$);

    actions$.next(ScenariosActions.saveRequested({ name: 'Nothing', updateId: null }));

    expect(api.create).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it('deletes a scenario', () => {
    const effects = setup();
    api.delete.mockReturnValue(of(undefined));
    const emitted = collect(effects.delete$);

    actions$.next(ScenariosActions.deleteRequested({ id: 7 }));

    expect(api.delete).toHaveBeenCalledWith(7);
    expect(emitted).toEqual([ScenariosActions.deleteSucceeded({ id: 7 })]);
  });

  it('reports a scenario that could not be deleted', () => {
    const effects = setup();
    api.delete.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const emitted = collect(effects.delete$);

    actions$.next(ScenariosActions.deleteRequested({ id: 7 }));

    expect(emitted[0].type).toBe(ScenariosActions.actionFailed.type);
  });

  it('starts and stops sharing', () => {
    const effects = setup();
    const shared = { ...saved, publicId: 'public-id' };
    api.share.mockReturnValue(of(shared));
    api.unshare.mockReturnValue(of(saved));
    const emitted = collect(effects.share$);

    actions$.next(ScenariosActions.shareToggled({ id: 7, shared: true }));
    actions$.next(ScenariosActions.shareToggled({ id: 7, shared: false }));

    expect(api.share).toHaveBeenCalledWith(7);
    expect(api.unshare).toHaveBeenCalledWith(7);
    expect(emitted).toEqual([
      ScenariosActions.scenarioUpdated({ scenario: shared }),
      ScenariosActions.scenarioUpdated({ scenario: saved }),
    ]);
  });

  it('loads a shared scenario together with its standings', () => {
    const effects = setup();
    api.shared.mockReturnValue(of(saved));
    api.sharedStandings.mockReturnValue(of(standings));
    const emitted = collect(effects.loadShared$);

    actions$.next(ScenariosActions.sharedOpened({ publicId: 'abc' }));

    expect(emitted).toEqual([ScenariosActions.sharedLoaded({ publicId: 'abc', scenario: saved, standings })]);
  });

  it('explains a link that is not valid any more', () => {
    const effects = setup();
    api.shared.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    api.sharedStandings.mockReturnValue(of(standings));
    const emitted = collect(effects.loadShared$);

    actions$.next(ScenariosActions.sharedOpened({ publicId: 'gone' }));

    expect(emitted).toEqual([
      ScenariosActions.sharedFailed({
        publicId: 'gone',
        error: 'This link is not valid, or the scenario is no longer shared.',
      }),
    ]);
  });
});
