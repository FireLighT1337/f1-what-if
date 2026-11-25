import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { DefaultUrlSerializer, Router } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { Subject, of, throwError } from 'rxjs';
import { AuthApi } from '../../core/auth-api';
import { TokenStorage } from '../../core/token-storage';
import { AuthActions } from './auth.actions';
import { AuthEffects, safeReturnUrl } from './auth.effects';

const NOW = new Date('2026-11-18T10:00:00Z');
const tokenResponse = { accessToken: 'abc', tokenType: 'Bearer', expiresInSeconds: 3600 };
const user = { id: 1, username: 'asad', role: 'USER' };

describe('AuthEffects', () => {
  let actions$: Subject<Action>;
  let api: { login: ReturnType<typeof vi.fn>; register: ReturnType<typeof vi.fn>; me: ReturnType<typeof vi.fn> };
  let storage: { save: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };
  let router: { url: string; parseUrl: (url: string) => unknown; navigateByUrl: ReturnType<typeof vi.fn>; navigate: ReturnType<typeof vi.fn> };

  function setup(url = '/login'): AuthEffects {
    actions$ = new Subject<Action>();
    api = { login: vi.fn(), register: vi.fn(), me: vi.fn() };
    storage = { save: vi.fn(), clear: vi.fn() };
    router = {
      url,
      parseUrl: (value: string) => new DefaultUrlSerializer().parse(value),
      navigateByUrl: vi.fn(),
      navigate: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        AuthEffects,
        provideMockActions(() => actions$),
        { provide: AuthApi, useValue: api },
        { provide: TokenStorage, useValue: storage },
        { provide: Router, useValue: router },
      ],
    });
    return TestBed.inject(AuthEffects);
  }

  function collect(effect$: { subscribe(next: (action: Action) => void): unknown }): Action[] {
    const emitted: Action[] = [];
    effect$.subscribe((action) => emitted.push(action));
    return emitted;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => vi.useRealTimers());

  it('logs in and works out when the token runs out', () => {
    const effects = setup();
    api.login.mockReturnValue(of(tokenResponse));
    const emitted = collect(effects.login$);

    actions$.next(AuthActions.loginSubmitted({ username: 'asad', password: 'secret-password' }));

    expect(api.login).toHaveBeenCalledWith('asad', 'secret-password');
    expect(emitted).toEqual([AuthActions.loginSucceeded({ token: 'abc', expiresAt: NOW.getTime() + 3_600_000 })]);
  });

  it('reports a failed login with a readable message', () => {
    const effects = setup();
    api.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const emitted = collect(effects.login$);

    actions$.next(AuthActions.loginSubmitted({ username: 'someone', password: 'wrong-password' }));

    expect(emitted).toEqual([AuthActions.authFailed({ error: 'Invalid username or password.' })]);
  });

  it('creates the account and then logs in', () => {
    const effects = setup();
    api.register.mockReturnValue(of(user));
    api.login.mockReturnValue(of(tokenResponse));
    const emitted = collect(effects.register$);

    actions$.next(AuthActions.registerSubmitted({ username: 'asad', password: 'secret-password' }));

    expect(api.register).toHaveBeenCalledWith('asad', 'secret-password');
    expect(api.login).toHaveBeenCalledWith('asad', 'secret-password');
    expect(emitted).toEqual([AuthActions.loginSucceeded({ token: 'abc', expiresAt: NOW.getTime() + 3_600_000 })]);
  });

  it('does not try to log in when the username is already taken', () => {
    const effects = setup();
    api.register.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    const emitted = collect(effects.register$);

    actions$.next(AuthActions.registerSubmitted({ username: 'asad', password: 'secret-password' }));

    expect(api.login).not.toHaveBeenCalled();
    expect(emitted).toEqual([AuthActions.authFailed({ error: 'That username is already taken.' })]);
  });

  it('loads the user after logging in or restoring a session', () => {
    const effects = setup();
    api.me.mockReturnValue(of(user));
    const emitted = collect(effects.loadUser$);

    actions$.next(AuthActions.loginSucceeded({ token: 'abc', expiresAt: 1 }));
    actions$.next(AuthActions.sessionRestored({ token: 'abc', expiresAt: 1 }));

    expect(emitted).toEqual([AuthActions.userLoaded({ user }), AuthActions.userLoaded({ user })]);
  });

  it('ignores a failure to load the user, because the interceptor ends an invalid session', () => {
    const effects = setup();
    api.me.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const emitted = collect(effects.loadUser$);

    actions$.next(AuthActions.sessionRestored({ token: 'abc', expiresAt: 1 }));

    expect(emitted).toEqual([]);
  });

  it('saves the session after logging in, but not when it is only restored', () => {
    const effects = setup();
    effects.saveSession$.subscribe();

    actions$.next(AuthActions.sessionRestored({ token: 'old', expiresAt: 1 }));
    actions$.next(AuthActions.loginSucceeded({ token: 'abc', expiresAt: 5 }));

    expect(storage.save).toHaveBeenCalledTimes(1);
    expect(storage.save).toHaveBeenCalledWith({ token: 'abc', expiresAt: 5 });
  });

  it('forgets the saved session on logout and on expiry', () => {
    const effects = setup();
    effects.clearSession$.subscribe();

    actions$.next(AuthActions.logoutClicked());
    actions$.next(AuthActions.sessionExpired());

    expect(storage.clear).toHaveBeenCalledTimes(2);
  });

  it('goes back to where the user wanted to go after logging in', () => {
    const effects = setup('/login?returnUrl=%2Fscenarios');
    effects.goToReturnUrl$.subscribe();

    actions$.next(AuthActions.loginSucceeded({ token: 'abc', expiresAt: 5 }));

    expect(router.navigateByUrl).toHaveBeenCalledWith('/scenarios');
  });

  it('goes to the explorer when there is no place to return to', () => {
    const effects = setup('/login');
    effects.goToReturnUrl$.subscribe();

    actions$.next(AuthActions.loginSucceeded({ token: 'abc', expiresAt: 5 }));

    expect(router.navigateByUrl).toHaveBeenCalledWith('/explorer');
  });

  it('sends the user to the login page when the session expires on a protected page', () => {
    const effects = setup('/scenarios');
    effects.leaveProtectedPages$.subscribe();

    actions$.next(AuthActions.sessionExpired());

    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { expired: 1, returnUrl: '/scenarios' } });
  });

  it('leaves the protected pages on logout', () => {
    const effects = setup('/scenarios');
    effects.leaveProtectedPages$.subscribe();

    actions$.next(AuthActions.logoutClicked());

    expect(router.navigateByUrl).toHaveBeenCalledWith('/explorer');
  });

  it('stays on public pages when the session expires', () => {
    const effects = setup('/explorer');
    effects.leaveProtectedPages$.subscribe();

    actions$.next(AuthActions.sessionExpired());
    actions$.next(AuthActions.logoutClicked());

    expect(router.navigate).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});

describe('safeReturnUrl', () => {
  it('accepts paths inside the app', () => {
    expect(safeReturnUrl('/scenarios')).toBe('/scenarios');
    expect(safeReturnUrl('/seasons/1984/drivers/2')).toBe('/seasons/1984/drivers/2');
  });

  it('rejects anything that could lead to another site', () => {
    expect(safeReturnUrl('//evil.example')).toBe('/explorer');
    expect(safeReturnUrl('https://evil.example')).toBe('/explorer');
    expect(safeReturnUrl('javascript:alert(1)')).toBe('/explorer');
    expect(safeReturnUrl(undefined)).toBe('/explorer');
    expect(safeReturnUrl(42)).toBe('/explorer');
  });
});
