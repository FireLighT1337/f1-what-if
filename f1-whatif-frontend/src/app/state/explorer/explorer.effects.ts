import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, debounceTime, filter, map, of, switchMap, withLatestFrom } from 'rxjs';
import { describeError } from '../../core/describe-error';
import { F1Api } from '../../core/f1-api';
import { StandingsQuery } from '../../core/models';
import { ReferenceActions } from '../reference/reference.actions';
import { ExplorerActions } from './explorer.actions';
import { selectStandingsQuery } from './explorer.selectors';

/** Debounce for quick successive changes, such as ticking several drivers in a row. */
export const STANDINGS_DEBOUNCE_MS = 250;

@Injectable()
export class ExplorerEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly api = inject(F1Api);

  /**
   * Any change to the selection asks for new standings. Changes that arrive within the
   * debounce window are merged into one request, and a newer request cancels an older one
   * that is still running, so a slow response can never overwrite a newer result.
   */
  readonly loadStandings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ReferenceActions.initialLoadSucceeded,
        ExplorerActions.seasonChanged,
        ExplorerActions.rulesetChanged,
        ExplorerActions.includeSprintsChanged,
        ExplorerActions.countBestChanged,
        ExplorerActions.driverExclusionToggled,
        ExplorerActions.roundExclusionToggled,
        ExplorerActions.exclusionsCleared,
      ),
      debounceTime(STANDINGS_DEBOUNCE_MS),
      withLatestFrom(this.store.select(selectStandingsQuery)),
      map(([, query]) => query),
      filter((query): query is StandingsQuery => query !== null),
      switchMap((query) =>
        this.api.standings(query).pipe(
          map((response) => ExplorerActions.standingsSucceeded({ response })),
          catchError((error: unknown) => of(ExplorerActions.standingsFailed({ error: describeError(error) }))),
        ),
      ),
    ),
  );
}
