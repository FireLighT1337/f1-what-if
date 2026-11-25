import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Subject, of, throwError } from 'rxjs';
import { F1Api } from '../../core/f1-api';
import { StandingsQuery, StandingsResponse } from '../../core/models';
import { ExplorerActions } from './explorer.actions';
import { ExplorerEffects, STANDINGS_DEBOUNCE_MS } from './explorer.effects';
import { selectStandingsQuery } from './explorer.selectors';

const query: StandingsQuery = {
  year: 1984,
  ruleset: 'classic-1961',
  includeSprints: true,
  countBest: null,
  excludeDrivers: [],
  excludeRaces: [],
};
const response: StandingsResponse = { season: 1984, ruleset: 'classic-1961', standings: [] };

describe('ExplorerEffects', () => {
  // Selector overrides live on module-level selectors; without a reset they leak into other spec files.
  afterEach(() => TestBed.inject(MockStore).resetSelectors());
  let actions$: Subject<Action>;
  let api: { standings: ReturnType<typeof vi.fn> };
  let emitted: Action[];

  beforeEach(() => {
    vi.useFakeTimers();
    actions$ = new Subject<Action>();
    api = { standings: vi.fn() };
    emitted = [];
    TestBed.configureTestingModule({
      providers: [
        ExplorerEffects,
        provideMockActions(() => actions$),
        provideMockStore({ selectors: [{ selector: selectStandingsQuery, value: query }] }),
        { provide: F1Api, useValue: api },
      ],
    });
    TestBed.inject(ExplorerEffects).loadStandings$.subscribe((action) => emitted.push(action));
  });

  afterEach(() => vi.useRealTimers());

  it('merges quick successive changes into a single request', () => {
    api.standings.mockReturnValue(of(response));

    actions$.next(ExplorerActions.driverExclusionToggled({ driverId: 1 }));
    actions$.next(ExplorerActions.driverExclusionToggled({ driverId: 2 }));
    vi.advanceTimersByTime(STANDINGS_DEBOUNCE_MS);

    expect(api.standings).toHaveBeenCalledTimes(1);
    expect(api.standings).toHaveBeenCalledWith(query);
    expect(emitted).toEqual([ExplorerActions.standingsSucceeded({ response })]);
  });

  it('reports a failed request with a readable message', () => {
    api.standings.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    actions$.next(ExplorerActions.seasonChanged({ year: 1900 }));
    vi.advanceTimersByTime(STANDINGS_DEBOUNCE_MS);

    expect(emitted).toEqual([ExplorerActions.standingsFailed({ error: 'No data found for this selection.' })]);
  });

  it('keeps working after a failed request', () => {
    api.standings.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
    api.standings.mockReturnValueOnce(of(response));

    actions$.next(ExplorerActions.rulesetChanged({ code: 'a' }));
    vi.advanceTimersByTime(STANDINGS_DEBOUNCE_MS);
    actions$.next(ExplorerActions.rulesetChanged({ code: 'b' }));
    vi.advanceTimersByTime(STANDINGS_DEBOUNCE_MS);

    expect(emitted).toHaveLength(2);
    expect(emitted[1]).toEqual(ExplorerActions.standingsSucceeded({ response }));
  });

  it('does not ask for standings while the selection is incomplete', () => {
    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectStandingsQuery, null);
    store.refreshState();

    actions$.next(ExplorerActions.exclusionsCleared());
    vi.advanceTimersByTime(STANDINGS_DEBOUNCE_MS);

    expect(api.standings).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it('recalculates the standings when the defaults are restored', () => {
    api.standings.mockReturnValue(of(response));

    actions$.next(ExplorerActions.defaultsRestored({ seasons: [], rulesets: [] }));
    vi.advanceTimersByTime(STANDINGS_DEBOUNCE_MS);

    expect(api.standings).toHaveBeenCalledWith(query);
    expect(emitted).toEqual([ExplorerActions.standingsSucceeded({ response })]);
  });
});
