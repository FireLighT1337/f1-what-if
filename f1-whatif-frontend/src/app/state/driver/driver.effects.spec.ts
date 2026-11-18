import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { Subject, of, throwError } from 'rxjs';
import { F1Api } from '../../core/f1-api';
import { DriverPhoto, DriverSeasonResponse } from '../../core/models';
import { DriverActions } from './driver.actions';
import { DriverEffects } from './driver.effects';
import { DriverState, driverKey, initialDriverState } from './driver.reducer';

const response: DriverSeasonResponse = {
  driver: { id: 2, name: 'Alain Prost', code: 'PRO', nationality: 'French', dateOfBirth: null, wikipediaUrl: null },
  season: 1984,
  summary: { racesEntered: 0, wins: 0, podiums: 0, points: 0 },
  races: [],
};
const photo: DriverPhoto = { photoUrl: 'https://x/y.jpg', sourceUrl: 'https://x', articleUrl: 'https://y', width: 320, height: 400 };

describe('DriverEffects', () => {
  let actions$: Subject<Action>;
  let api: { driverSeason: ReturnType<typeof vi.fn>; driverPhoto: ReturnType<typeof vi.fn> };

  function setup(state: Partial<DriverState> = {}): DriverEffects {
    actions$ = new Subject<Action>();
    api = { driverSeason: vi.fn(), driverPhoto: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        DriverEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: { driver: { ...initialDriverState, ...state } } }),
        { provide: F1Api, useValue: api },
      ],
    });
    return TestBed.inject(DriverEffects);
  }

  function collect(effect$: { subscribe(next: (action: Action) => void): unknown }): Action[] {
    const emitted: Action[] = [];
    effect$.subscribe((action) => emitted.push(action));
    return emitted;
  }

  it('asks for the results the first time a driver page opens', () => {
    const emitted = collect(setup().requestResults$);

    actions$.next(DriverActions.pageOpened({ year: 1984, driverId: 2 }));

    expect(emitted).toEqual([DriverActions.resultsRequested({ year: 1984, driverId: 2 })]);
  });

  it('does not ask again for results that are loaded or loading', () => {
    const effects = setup({
      entries: { [driverKey(1984, 2)]: { status: 'loaded', data: response, error: null } },
    });
    const emitted = collect(effects.requestResults$);

    actions$.next(DriverActions.pageOpened({ year: 1984, driverId: 2 }));

    expect(emitted).toEqual([]);
  });

  it('asks again after an error', () => {
    const effects = setup({
      entries: { [driverKey(1984, 2)]: { status: 'error', data: null, error: 'Nope' } },
    });
    const emitted = collect(effects.requestResults$);

    actions$.next(DriverActions.pageOpened({ year: 1984, driverId: 2 }));

    expect(emitted).toHaveLength(1);
  });

  it('loads the results of a driver', () => {
    const effects = setup();
    api.driverSeason.mockReturnValue(of(response));
    const emitted = collect(effects.loadResults$);

    actions$.next(DriverActions.resultsRequested({ year: 1984, driverId: 2 }));

    expect(api.driverSeason).toHaveBeenCalledWith(1984, 2);
    expect(emitted).toEqual([DriverActions.resultsSucceeded({ year: 1984, driverId: 2, response })]);
  });

  it('explains a missing driver in plain words', () => {
    const effects = setup();
    api.driverSeason.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const emitted = collect(effects.loadResults$);

    actions$.next(DriverActions.resultsRequested({ year: 1900, driverId: 2 }));

    expect(emitted).toEqual([
      DriverActions.resultsFailed({ year: 1900, driverId: 2, error: 'This driver did not take part in that season.' }),
    ]);
  });

  it('requests a photo only once per driver', () => {
    const effects = setup({ photos: { 5: photo }, photosRequested: [7] });
    const emitted = collect(effects.requestPhoto$);

    actions$.next(DriverActions.pageOpened({ year: 1984, driverId: 5 }));
    actions$.next(DriverActions.pageOpened({ year: 1984, driverId: 7 }));
    actions$.next(DriverActions.pageOpened({ year: 1984, driverId: 9 }));

    expect(emitted).toEqual([DriverActions.photoRequested({ driverId: 9 })]);
  });

  it('stores the photo that was found', () => {
    const effects = setup();
    api.driverPhoto.mockReturnValue(of(photo));
    const emitted = collect(effects.loadPhoto$);

    actions$.next(DriverActions.photoRequested({ driverId: 2 }));

    expect(emitted).toEqual([DriverActions.photoLoaded({ driverId: 2, photo })]);
  });

  it('treats a failed photo lookup as "no photo" instead of an error', () => {
    const effects = setup();
    api.driverPhoto.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const emitted = collect(effects.loadPhoto$);

    actions$.next(DriverActions.photoRequested({ driverId: 2 }));

    expect(emitted).toHaveLength(1);
    const action = emitted[0] as ReturnType<typeof DriverActions.photoLoaded>;
    expect(action.photo.photoUrl).toBeNull();
  });
});
