import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthApi } from '../../core/auth-api';
import { describeAuthError } from '../../core/describe-auth-error';
import { TokenStorage } from '../../core/token-storage';
import { TokenResponse } from '../../core/models';
import { AuthActions } from './auth.actions';

function toSession(response: TokenResponse): { token: string; expiresAt: number } {
  return { token: response.accessToken, expiresAt: Date.now() + response.expiresInSeconds * 1000 };
}

/** Only paths inside this app are accepted as a place to return to after logging in. */
export function safeReturnUrl(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/explorer';
}

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(AuthApi);
  private readonly storage = inject(TokenStorage);
  private readonly router = inject(Router);

  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSubmitted),
      switchMap(({ email, password }) =>
        this.api.login(email, password).pipe(
          map((response) => AuthActions.loginSucceeded(toSession(response))),
          catchError((error: unknown) => of(AuthActions.authFailed({ error: describeAuthError(error, 'login') }))),
        ),
      ),
    ),
  );

  /** Creating an account logs the user in right away. */
  readonly register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.registerSubmitted),
      switchMap(({ email, password }) =>
        this.api.register(email, password).pipe(
          switchMap(() => this.api.login(email, password)),
          map((response) => AuthActions.loginSucceeded(toSession(response))),
          catchError((error: unknown) => of(AuthActions.authFailed({ error: describeAuthError(error, 'register') }))),
        ),
      ),
    ),
  );

  /** Fetches who is logged in. An expired token is handled by the interceptor, so other errors are ignored. */
  readonly loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSucceeded, AuthActions.sessionRestored),
      switchMap(() =>
        this.api.me().pipe(
          map((user) => AuthActions.userLoaded({ user })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  readonly saveSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSucceeded),
        tap(({ token, expiresAt }) => this.storage.save({ token, expiresAt })),
      ),
    { dispatch: false },
  );

  readonly clearSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutClicked, AuthActions.sessionExpired),
        tap(() => this.storage.clear()),
      ),
    { dispatch: false },
  );

  readonly goToReturnUrl$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSucceeded),
        tap(() => {
          const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'];
          void this.router.navigateByUrl(safeReturnUrl(returnUrl));
        }),
      ),
    { dispatch: false },
  );

  /** Logging out or an expired session leaves the pages that need an account. */
  readonly leaveProtectedPages$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutClicked, AuthActions.sessionExpired),
        tap((action) => {
          const url = this.router.url;
          if (!url.startsWith('/scenarios')) {
            return;
          }
          if (action.type === AuthActions.sessionExpired.type) {
            void this.router.navigate(['/login'], { queryParams: { expired: 1, returnUrl: url } });
          } else {
            void this.router.navigateByUrl('/explorer');
          }
        }),
      ),
    { dispatch: false },
  );
}
