import { createFeature, createReducer, on } from '@ngrx/store';
import { UserInfo } from '../../core/models';
import { AuthActions } from './auth.actions';

export interface AuthState {
  token: string | null;
  /** Milliseconds since 1970. */
  expiresAt: number | null;
  user: UserInfo | null;
  /** True while a login or registration request is running. */
  working: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  token: null,
  expiresAt: null,
  user: null,
  working: false,
  error: null,
};

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialAuthState,
    on(AuthActions.formOpened, (state) => ({ ...state, error: null })),
    on(AuthActions.loginSubmitted, AuthActions.registerSubmitted, (state) => ({ ...state, working: true, error: null })),
    on(AuthActions.loginSucceeded, AuthActions.sessionRestored, (state, { token, expiresAt }) => ({
      ...state,
      token,
      expiresAt,
      working: false,
      error: null,
    })),
    on(AuthActions.userLoaded, (state, { user }) => ({ ...state, user })),
    on(AuthActions.authFailed, (state, { error }) => ({ ...state, working: false, error })),
    on(AuthActions.logoutClicked, AuthActions.sessionExpired, () => initialAuthState),
  ),
});
