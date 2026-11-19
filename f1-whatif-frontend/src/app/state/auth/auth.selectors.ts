import { createSelector } from '@ngrx/store';
import { authFeature } from './auth.reducer';

export const selectIsLoggedIn = createSelector(authFeature.selectToken, (token) => token !== null);

/** The session data the guard needs; the current time is checked by the caller, not memoized here. */
export const selectSession = createSelector(authFeature.selectToken, authFeature.selectExpiresAt, (token, expiresAt) => ({
  token,
  expiresAt,
}));
