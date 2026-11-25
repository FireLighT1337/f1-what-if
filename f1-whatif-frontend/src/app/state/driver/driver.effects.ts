import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, map, mergeMap, of, switchMap, withLatestFrom } from 'rxjs';
import { describeError } from '../../core/describe-error';
import { F1Api } from '../../core/f1-api';
import { DriverPhoto } from '../../core/models';
import { DriverActions } from './driver.actions';
import { driverFeature, driverKey, driverScenarioKey } from './driver.reducer';

const NO_PHOTO: DriverPhoto = { photoUrl: null, sourceUrl: null, articleUrl: null, width: null, height: null };

@Injectable()
export class DriverEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly api = inject(F1Api);

  /** Opening a driver page starts the results request, unless they are already loaded or loading. */
  readonly requestResults$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DriverActions.pageOpened),
      withLatestFrom(this.store.select(driverFeature.selectEntries)),
      filter(([{ year, driverId }, entries]) => {
        const entry = entries[driverKey(year, driverId)];
        return entry === undefined || entry.status === 'error';
      }),
      map(([{ year, driverId }]) => DriverActions.resultsRequested({ year, driverId })),
    ),
  );

  readonly loadResults$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DriverActions.resultsRequested),
      mergeMap(({ year, driverId }) =>
        this.api.driverSeason(year, driverId).pipe(
          map((response) => DriverActions.resultsSucceeded({ year, driverId, response })),
          catchError((error: unknown) =>
            of(DriverActions.resultsFailed({ year, driverId, error: describeDriverError(error) })),
          ),
        ),
      ),
    ),
  );

  /** A scenario page asks for its results, unless the same scenario is already loaded or loading. */
  readonly requestScenarioResults$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DriverActions.scenarioPageOpened),
      withLatestFrom(this.store.select(driverFeature.selectScenarioEntries)),
      filter(([{ year, driverId, params }, entries]) => {
        const entry = entries[driverScenarioKey(year, driverId, params)];
        return entry === undefined || entry.status === 'error';
      }),
      map(([{ year, driverId, params }]) => DriverActions.scenarioResultsRequested({ year, driverId, params })),
    ),
  );

  readonly loadScenarioResults$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DriverActions.scenarioResultsRequested),
      mergeMap(({ year, driverId, params }) =>
        this.api.driverScenario(year, driverId, params).pipe(
          map((response) => DriverActions.scenarioResultsSucceeded({ year, driverId, params, response })),
          catchError((error: unknown) =>
            of(DriverActions.scenarioResultsFailed({ year, driverId, params, error: describeScenarioError(error) })),
          ),
        ),
      ),
    ),
  );

  /** The photo is looked up separately, so the results never wait for Wikipedia. */
  readonly requestPhoto$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DriverActions.pageOpened),
      withLatestFrom(this.store.select(driverFeature.selectPhotos), this.store.select(driverFeature.selectPhotosRequested)),
      filter(([{ driverId }, photos, requested]) => !(driverId in photos) && !requested.includes(driverId)),
      map(([{ driverId }]) => DriverActions.photoRequested({ driverId })),
    ),
  );

  readonly loadPhoto$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DriverActions.photoRequested),
      mergeMap(({ driverId }) =>
        this.api.driverPhoto(driverId).pipe(
          // A missing photo is not worth an error message: the page shows initials instead.
          catchError(() => of(NO_PHOTO)),
          map((photo) => DriverActions.photoLoaded({ driverId, photo })),
        ),
      ),
    ),
  );
}

function describeDriverError(error: unknown): string {
  const message = describeError(error);
  return message === 'No data found for this selection.' ? 'This driver did not take part in that season.' : message;
}

function describeScenarioError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    switch (error.status) {
      case 400:
        return 'These scenario settings are not valid.';
      case 404:
        return 'The driver has no results left under this scenario, or the points system is unknown.';
      case 409:
        return 'This driver is excluded in the scenario.';
    }
  }
  return describeError(error);
}
