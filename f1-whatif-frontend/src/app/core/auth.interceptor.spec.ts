import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { AuthActions } from '../state/auth/auth.actions';
import { initialAuthState } from '../state/auth/auth.reducer';
import { authInterceptor, needsToken } from './auth.interceptor';

describe('needsToken', () => {
  it('is true for the calls that need a login', () => {
    expect(needsToken('/api/auth/me', '/api')).toBe(true);
    expect(needsToken('/api/scenarios', '/api')).toBe(true);
    expect(needsToken('/api/scenarios/5', '/api')).toBe(true);
    expect(needsToken('/api/scenarios/5/share', '/api')).toBe(true);
  });

  it('is false for public calls, so an expired token cannot break them', () => {
    expect(needsToken('/api/auth/login', '/api')).toBe(false);
    expect(needsToken('/api/auth/register', '/api')).toBe(false);
    expect(needsToken('/api/seasons/1984/standings', '/api')).toBe(false);
    expect(needsToken('/api/shared/abc', '/api')).toBe(false);
    expect(needsToken('/api/scenarios-old', '/api')).toBe(false);
    expect(needsToken('https://example.com/api/scenarios', '/api')).toBe(false);
  });
});

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let store: MockStore;

  function setup(token: string | null) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideMockStore({ initialState: { auth: { ...initialAuthState, token } } }),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    store = TestBed.inject(MockStore);
  }

  afterEach(() => backend.verify());

  it('adds the token to calls that need it', () => {
    setup('abc');

    http.get('/api/scenarios').subscribe();

    const request = backend.expectOne('/api/scenarios');
    expect(request.request.headers.get('Authorization')).toBe('Bearer abc');
    request.flush([]);
  });

  it('leaves public calls alone', () => {
    setup('abc');

    http.get('/api/seasons').subscribe();

    const request = backend.expectOne('/api/seasons');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });

  it('sends no header when nobody is logged in', () => {
    setup(null);

    http.get('/api/scenarios').subscribe({ error: () => undefined });

    const request = backend.expectOne('/api/scenarios');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('ends the session when the backend rejects the token', () => {
    setup('abc');
    const dispatch = vi.spyOn(store, 'dispatch');
    let failed = false;

    http.get('/api/scenarios').subscribe({ error: () => (failed = true) });
    backend.expectOne('/api/scenarios').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(dispatch).toHaveBeenCalledWith(AuthActions.sessionExpired());
    expect(failed).toBe(true);
  });

  it('does not end the session because of other errors', () => {
    setup('abc');
    const dispatch = vi.spyOn(store, 'dispatch');

    http.get('/api/scenarios').subscribe({ error: () => undefined });
    backend.expectOne('/api/scenarios').flush({}, { status: 500, statusText: 'Server Error' });

    expect(dispatch).not.toHaveBeenCalled();
  });
});
