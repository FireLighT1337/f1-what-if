import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable, firstValueFrom } from 'rxjs';
import { initialAuthState } from '../state/auth/auth.reducer';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let store: MockStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideMockStore({ initialState: { auth: initialAuthState } })],
    });
    store = TestBed.inject(MockStore);
  });

  function run(url: string): Promise<boolean | UrlTree> {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
    return firstValueFrom(result as Observable<boolean | UrlTree>);
  }

  it('lets a logged-in user through', async () => {
    store.setState({ auth: { ...initialAuthState, token: 'abc', expiresAt: Date.now() + 60_000 } });

    expect(await run('/scenarios')).toBe(true);
  });

  it('sends a visitor to the login page and remembers where they wanted to go', async () => {
    const result = (await run('/scenarios')) as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login?returnUrl=%2Fscenarios');
  });

  it('treats a token that has run out as not logged in', async () => {
    store.setState({ auth: { ...initialAuthState, token: 'abc', expiresAt: Date.now() - 1 } });

    expect(await run('/scenarios')).toBeInstanceOf(UrlTree);
  });
});
