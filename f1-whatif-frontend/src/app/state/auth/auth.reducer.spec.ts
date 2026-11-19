import { AuthActions } from './auth.actions';
import { AuthState, authFeature, initialAuthState } from './auth.reducer';

const reduce = authFeature.reducer;
const user = { id: 1, email: 'asad@example.com', role: 'USER' };

describe('auth reducer', () => {
  it('shows that a login or sign up is running and clears an old error', () => {
    const failed: AuthState = { ...initialAuthState, error: 'Nope' };

    const state = reduce(failed, AuthActions.loginSubmitted({ email: 'a@b.c', password: 'x' }));

    expect(state.working).toBe(true);
    expect(state.error).toBeNull();
    expect(reduce(failed, AuthActions.registerSubmitted({ email: 'a@b.c', password: 'x' })).working).toBe(true);
  });

  it('stores the token after logging in', () => {
    const working: AuthState = { ...initialAuthState, working: true };

    const state = reduce(working, AuthActions.loginSucceeded({ token: 'abc', expiresAt: 123 }));

    expect(state).toMatchObject({ token: 'abc', expiresAt: 123, working: false, error: null });
  });

  it('restores a saved session', () => {
    const state = reduce(initialAuthState, AuthActions.sessionRestored({ token: 'abc', expiresAt: 123 }));

    expect(state.token).toBe('abc');
  });

  it('stores the user and the error', () => {
    expect(reduce(initialAuthState, AuthActions.userLoaded({ user })).user).toEqual(user);

    const failed = reduce({ ...initialAuthState, working: true }, AuthActions.authFailed({ error: 'Invalid email or password.' }));
    expect(failed.working).toBe(false);
    expect(failed.error).toBe('Invalid email or password.');
  });

  it('forgets everything when logging out or when the session expires', () => {
    const loggedIn: AuthState = { ...initialAuthState, token: 'abc', expiresAt: 123, user };

    expect(reduce(loggedIn, AuthActions.logoutClicked())).toEqual(initialAuthState);
    expect(reduce(loggedIn, AuthActions.sessionExpired())).toEqual(initialAuthState);
  });

  it('clears the error when the form is opened', () => {
    expect(reduce({ ...initialAuthState, error: 'Nope' }, AuthActions.formOpened()).error).toBeNull();
  });
});
