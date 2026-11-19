import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { AuthActions } from '../../state/auth/auth.actions';
import { AuthState, initialAuthState } from '../../state/auth/auth.reducer';
import { AuthPage } from './auth-page';

describe('AuthPage', () => {
  function create(inputs: Record<string, unknown> = {}, auth: Partial<AuthState> = {}) {
    TestBed.configureTestingModule({
      imports: [AuthPage],
      providers: [provideRouter([]), provideMockStore({ initialState: { auth: { ...initialAuthState, ...auth } } })],
    });
    const fixture = TestBed.createComponent(AuthPage);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    const store = TestBed.inject(MockStore);
    const dispatch = vi.spyOn(store, 'dispatch');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    function fill(email: string, password: string): void {
      const emailInput = element.querySelector<HTMLInputElement>('#email')!;
      const passwordInput = element.querySelector<HTMLInputElement>('#password')!;
      emailInput.value = email;
      emailInput.dispatchEvent(new Event('input'));
      passwordInput.value = password;
      passwordInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    function submit(): void {
      element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
    }

    return { fixture, element, dispatch, fill, submit };
  }

  it('logs in with the entered email and password', () => {
    const { fill, submit, dispatch } = create({ mode: 'login' });

    fill('asad@example.com', 'secret-password');
    submit();

    expect(dispatch).toHaveBeenCalledWith(AuthActions.loginSubmitted({ email: 'asad@example.com', password: 'secret-password' }));
  });

  it('creates an account in sign up mode', () => {
    const { element, fill, submit, dispatch } = create({ mode: 'register' });

    fill('asad@example.com', 'secret-password');
    submit();

    expect(element.querySelector('h1')?.textContent).toContain('Create an account');
    expect(dispatch).toHaveBeenCalledWith(AuthActions.registerSubmitted({ email: 'asad@example.com', password: 'secret-password' }));
  });

  it('does not send anything while the form is invalid, and says what is wrong', () => {
    const { element, fill, submit, dispatch } = create({ mode: 'login' });

    fill('not-an-email', 'short');
    submit();

    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: AuthActions.loginSubmitted.type }));
    expect(element.textContent).toContain('Enter a valid email address.');
    expect(element.textContent).toContain('Use 8 to 72 characters.');
  });

  it('shows the error from the server', () => {
    const { element } = create({ mode: 'login' }, { error: 'Invalid email or password.' });

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Invalid email or password.');
  });

  it('disables the button while a request is running', () => {
    const { element } = create({ mode: 'login' }, { working: true });

    const button = element.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Please wait');
  });

  it('tells the user when the session has expired', () => {
    const { element } = create({ mode: 'login', expired: '1' });

    expect(element.querySelector('[role="status"]')?.textContent).toContain('session has expired');
  });

  it('links to the other form and keeps the place to return to', () => {
    const { element } = create({ mode: 'login', returnUrl: '/scenarios' });

    const link = element.querySelector<HTMLAnchorElement>('a[href^="/register"]')!;
    expect(link.getAttribute('href')).toBe('/register?returnUrl=%2Fscenarios');
  });

  it('clears an old error when the form is opened', () => {
    const { dispatch } = create({ mode: 'login' });

    expect(dispatch).toHaveBeenCalledWith(AuthActions.formOpened());
  });
});
