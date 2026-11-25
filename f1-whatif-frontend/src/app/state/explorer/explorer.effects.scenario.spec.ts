import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Subject, of } from 'rxjs';
import { F1Api } from '../../core/f1-api';
import { RaceInfo, ScenarioResponse, StandingsQuery, StandingsResponse } from '../../core/models';
import { ExplorerActions } from './explorer.actions';
import { ExplorerEffects, STANDINGS_DEBOUNCE_MS } from './explorer.effects';
import { selectSelectedRaces, selectStandingsQuery } from './explorer.selectors';

const query: StandingsQuery = {
  year: 1984,
  ruleset: 'classic-1961',
  includeSprints: true,
  countBest: null,
  excludeDrivers: [],
  excludeRaces: [66],
};
const response: StandingsResponse = { season: 1984, ruleset: 'classic-1961', standings: [] };
const scenario: ScenarioResponse = {
  id: 7,
  name: 'No Monaco',
  seasonYear: 1984,
  rulesetCode: 'classic-1961',
  includeSprints: true,
  countBest: null,
  excludedDriverIds: [],
  excludedRounds: [6],
  publicId: null,
  createdAt: '2026-11-18T10:00:00Z',
  updatedAt: '2026-11-18T10:00:00Z',
};
const monaco: RaceInfo = {
  id: 66, round: 6, name: 'Monaco Grand Prix', date: null, circuit: 'Circuit', locality: null, country: null,
  hasSprint: false, shortened: true, shortenedNote: null,
};

describe('ExplorerEffects with saved scenarios', () => {
  // Selector overrides live on module-level selectors; without a reset they leak into other spec files.
  afterEach(() => TestBed.inject(MockStore).resetSelectors());
  let actions$: Subject<Action>;
  let api: { standings: ReturnType<typeof vi.fn> };
  let store: MockStore;
  let emitted: Action[];

  beforeEach(() => {
    vi.useFakeTimers();
    actions$ = new Subject<Action>();
    api = { standings: vi.fn().mockReturnValue(of(response)) };
    emitted = [];
    TestBed.configureTestingModule({
      providers: [
        ExplorerEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [
            { selector: selectStandingsQuery, value: query },
            { selector: selectSelectedRaces, value: [] },
          ],
        }),
        { provide: F1Api, useValue: api },
      ],
    });
    store = TestBed.inject(MockStore);
    TestBed.inject(ExplorerEffects).loadStandings$.subscribe((action) => emitted.push(action));
  });

  afterEach(() => vi.useRealTimers());

  it('waits for the races of the scenario before asking for standings', () => {
    actions$.next(ExplorerActions.scenarioOpened({ scenario, owned: true }));
    vi.advanceTimersByTime(STANDINGS_DEBOUNCE_MS);

    expect(api.standings).not.toHaveBeenCalled();

    store.overrideSelector(selectSelectedRaces, [monaco]);
    store.refreshState();
    vi.advanceTimersByTime(STANDINGS_DEBOUNCE_MS);

    expect(api.standings).toHaveBeenCalledTimes(1);
    expect(api.standings).toHaveBeenCalledWith(query);
    expect(emitted).toEqual([ExplorerActions.standingsSucceeded({ response })]);
  });

  it('asks straight away when the races are already known', () => {
    store.overrideSelector(selectSelectedRaces, [monaco]);
    store.refreshState();

    actions$.next(ExplorerActions.scenarioOpened({ scenario, owned: false }));
    vi.advanceTimersByTime(STANDINGS_DEBOUNCE_MS);

    expect(api.standings).toHaveBeenCalledTimes(1);
  });
});
