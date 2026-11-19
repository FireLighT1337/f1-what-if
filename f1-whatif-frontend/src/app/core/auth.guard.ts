import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectSession } from '../state/auth/auth.selectors';

/** Lets logged-in users through and sends everyone else to the login page, remembering where they wanted to go. */
export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectSession).pipe(
    take(1),
    map(({ token, expiresAt }) =>
      token !== null && expiresAt !== null && expiresAt > Date.now()
        ? true
        : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }),
    ),
  );
};
