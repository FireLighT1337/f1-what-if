import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, catchError, filter, forkJoin, map, merge, of, switchMap, withLatestFrom } from 'rxjs';
import { describeError } from '../../core/describe-error';
import { F1Api } from '../../core/f1-api';
import { ExplorerActions } from '../explorer/explorer.actions';
import { explorerFeature } from '../explorer/explorer.reducer';
import { ReferenceActions } from './reference.actions';
import { referenceFeature } from './reference.reducer';

/** Loads the lists the explorer needs, and only fetches each of them once. */
@Injectable()
export class ReferenceEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly api = inject(F1Api);

  /** Names of the points systems for pages that do not load the whole explorer data. */
  readonly loadRulesets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReferenceActions.rulesetsNeeded),
      withLatestFrom(this.store.select(referenceFeature.selectRulesets)),
      filter(([, rulesets]) => rulesets.length === 0),
      switchMap(() =>
        this.api.rulesets().pipe(
          map((rulesets) => ReferenceActions.rulesetsLoaded({ rulesets })),
          // The names are a nicety; the pages fall back to the codes.
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  /** Opening the explorer starts the first load, unless it is already loaded or running. */
  readonly requestInitialLoad$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ExplorerActions.opened),
      withLatestFrom(this.store.select(referenceFeature.selectStatus)),
      filter(([, status]) => status === 'idle' || status === 'error'),
      map(() => ReferenceActions.initialLoadRequested()),
    ),
  );

  readonly loadInitial$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReferenceActions.initialLoadRequested),
      switchMap(() =>
        forkJoin({ seasons: this.api.seasons(), rulesets: this.api.rulesets() }).pipe(
          map(({ seasons, rulesets }) => ReferenceActions.initialLoadSucceeded({ seasons, rulesets })),
          catchError((error: unknown) => of(ReferenceActions.initialLoadFailed({ error: describeError(error) }))),
        ),
      ),
    ),
  );

  /** Races and drivers of the selected season, fetched the first time the season is selected. */
  readonly loadSeasonData$ = createEffect(() =>
    merge(
      this.actions$.pipe(
        ofType(ExplorerActions.seasonChanged),
        map(({ year }) => year),
      ),
      this.actions$.pipe(
        ofType(ExplorerActions.scenarioOpened),
        map(({ scenario }) => scenario.seasonYear),
      ),
      this.actions$.pipe(
        ofType(ReferenceActions.initialLoadSucceeded),
        withLatestFrom(this.store.select(explorerFeature.selectSeason)),
        map(([, season]) => season),
      ),
    ).pipe(
      filter((year): year is number => year !== null),
      withLatestFrom(this.store.select(referenceFeature.selectRacesBySeason)),
      filter(([year, cache]) => !(year in cache)),
      map(([year]) => year),
      switchMap((year) =>
        forkJoin({ races: this.api.races(year), drivers: this.api.drivers(year) }).pipe(
          map(({ races, drivers }) => ReferenceActions.seasonDataSucceeded({ year, races, drivers })),
          catchError((error: unknown) =>
            of(ReferenceActions.seasonDataFailed({ year, error: describeError(error) })),
          ),
        ),
      ),
    ),
  );

  /** Points table of the selected points system, fetched the first time it is selected. */
  readonly loadRulesetDetail$ = createEffect(() =>
    merge(
      this.actions$.pipe(
        ofType(ExplorerActions.rulesetChanged),
        map(({ code }) => code),
      ),
      this.actions$.pipe(
        ofType(ExplorerActions.scenarioOpened),
        map(({ scenario }) => scenario.rulesetCode),
      ),
      this.actions$.pipe(
        ofType(ReferenceActions.initialLoadSucceeded),
        withLatestFrom(this.store.select(explorerFeature.selectRulesetCode)),
        map(([, code]) => code),
      ),
    ).pipe(
      filter((code): code is string => code !== null),
      withLatestFrom(this.store.select(referenceFeature.selectRulesetDetails)),
      filter(([code, cache]) => !(code in cache)),
      map(([code]) => code),
      switchMap((code) =>
        this.api.ruleset(code).pipe(
          map((detail) => ReferenceActions.rulesetDetailSucceeded({ detail })),
          catchError((error: unknown) =>
            of(ReferenceActions.rulesetDetailFailed({ code, error: describeError(error) })),
          ),
        ),
      ),
    ),
  );
}
