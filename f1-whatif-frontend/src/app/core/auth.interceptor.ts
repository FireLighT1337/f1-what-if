import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { catchError, switchMap, take, throwError } from 'rxjs';
import { AuthActions } from '../state/auth/auth.actions';
import { authFeature } from '../state/auth/auth.reducer';
import { API_BASE_URL } from './api-config';

/**
 * Only these calls need the token. Sending it to public endpoints would be harmful: the backend
 * rejects an expired token even where no login is required, which would break the standings
 * for someone whose session ran out.
 */
export function needsToken(url: string, apiBase: string): boolean {
  return url === `${apiBase}/auth/me` || url === `${apiBase}/scenarios` || url.startsWith(`${apiBase}/scenarios/`);
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const store = inject(Store);
  const apiBase = inject(API_BASE_URL);

  if (!needsToken(request.url, apiBase)) {
    return next(request);
  }

  return store.select(authFeature.selectToken).pipe(
    take(1),
    switchMap((token) => {
      const outgoing = token === null ? request : request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      return next(outgoing).pipe(
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401 && token !== null) {
            store.dispatch(AuthActions.sessionExpired());
          }
          return throwError(() => error);
        }),
      );
    }),
  );
};
