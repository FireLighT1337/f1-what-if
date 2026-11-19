import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, forkJoin, map, mergeMap, of, switchMap, withLatestFrom } from 'rxjs';
import { describeError } from '../../core/describe-error';
import { ScenarioApi } from '../../core/scenario-api';
import { selectScenarioDraft } from '../explorer/explorer.selectors';
import { ScenariosActions } from './scenarios.actions';

function describeSaveError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 409) {
      return 'You have reached the limit of 50 saved scenarios. Delete one to save a new one.';
    }
    if (error.status === 400) {
      return 'This scenario could not be saved. Check the name and try again.';
    }
  }
  return describeError(error);
}

function describeSharedError(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 404) {
    return 'This link is not valid, or the scenario is no longer shared.';
  }
  return describeError(error);
}

@Injectable()
export class ScenariosEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly api = inject(ScenarioApi);

  readonly loadList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScenariosActions.pageOpened),
      switchMap(() =>
        this.api.list().pipe(
          map((items) => ScenariosActions.listLoaded({ items })),
          catchError((error: unknown) => of(ScenariosActions.listFailed({ error: describeError(error) }))),
        ),
      ),
    ),
  );

  /** Saves what is currently selected in the explorer, under the given name. */
  readonly save$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScenariosActions.saveRequested),
      withLatestFrom(this.store.select(selectScenarioDraft)),
      filter(([, draft]) => draft !== null),
      switchMap(([{ name, updateId }, draft]) => {
        const request = { ...draft!, name };
        const call = updateId === null ? this.api.create(request) : this.api.update(updateId, request);
        return call.pipe(
          map((scenario) => ScenariosActions.saveSucceeded({ scenario })),
          catchError((error: unknown) => of(ScenariosActions.saveFailed({ error: describeSaveError(error) }))),
        );
      }),
    ),
  );

  readonly delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScenariosActions.deleteRequested),
      mergeMap(({ id }) =>
        this.api.delete(id).pipe(
          map(() => ScenariosActions.deleteSucceeded({ id })),
          catchError((error: unknown) => of(ScenariosActions.actionFailed({ error: describeError(error) }))),
        ),
      ),
    ),
  );

  readonly share$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScenariosActions.shareToggled),
      mergeMap(({ id, shared }) =>
        (shared ? this.api.share(id) : this.api.unshare(id)).pipe(
          map((scenario) => ScenariosActions.scenarioUpdated({ scenario })),
          catchError((error: unknown) => of(ScenariosActions.actionFailed({ error: describeError(error) }))),
        ),
      ),
    ),
  );

  readonly loadShared$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScenariosActions.sharedOpened),
      switchMap(({ publicId }) =>
        forkJoin({ scenario: this.api.shared(publicId), standings: this.api.sharedStandings(publicId) }).pipe(
          map(({ scenario, standings }) => ScenariosActions.sharedLoaded({ publicId, scenario, standings })),
          catchError((error: unknown) =>
            of(ScenariosActions.sharedFailed({ publicId, error: describeSharedError(error) })),
          ),
        ),
      ),
    ),
  );
}
