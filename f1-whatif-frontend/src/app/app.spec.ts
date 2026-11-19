import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { AuthActions } from './state/auth/auth.actions';
import { AuthState, initialAuthState } from './state/auth/auth.reducer';
import { App } from './app';

describe('App', () => {
  function create(auth: Partial<AuthState> = {}) {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideMockStore({ initialState: { auth: { ...initialAuthState, ...auth } } })],
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement, store: TestBed.inject(MockStore) };
  }

  it('shows the app name and the explorer link', () => {
    const { element } = create();

    expect(element.textContent).toContain('F1 What-If');
    expect(element.querySelector('nav a')?.textContent).toContain('Explorer');
  });

  it('offers login and sign up to visitors', () => {
    const { element } = create();

    const links = Array.from(element.querySelectorAll('nav a')).map((a) => a.textContent?.trim());
    expect(links).toContain('Log in');
    expect(links).toContain('Sign up');
    expect(links).not.toContain('My scenarios');
  });

  it('shows the scenarios link, the email and a logout button once logged in', () => {
    const { element } = create({
      token: 'abc',
      expiresAt: Date.now() + 60_000,
      user: { id: 1, email: 'asad@example.com', role: 'USER' },
    });

    const links = Array.from(element.querySelectorAll('nav a')).map((a) => a.textContent?.trim());
    expect(links).toContain('My scenarios');
    expect(links).not.toContain('Log in');
    expect(element.querySelector('[data-testid="user-email"]')?.textContent).toContain('asad@example.com');
    expect(element.querySelector('nav button')?.textContent).toContain('Log out');
  });

  it('logs out when the button is clicked', () => {
    const { element, store } = create({ token: 'abc', expiresAt: Date.now() + 60_000 });
    const dispatch = vi.spyOn(store, 'dispatch');

    element.querySelector<HTMLButtonElement>('nav button')!.click();

    expect(dispatch).toHaveBeenCalledWith(AuthActions.logoutClicked());
  });
});
