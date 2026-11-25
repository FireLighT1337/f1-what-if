import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../state/auth/auth.actions';
import { authFeature } from '../../state/auth/auth.reducer';

/** One page for logging in and for creating an account; the route decides which. */
@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPage {
  /** Set by the route (data: { mode }). */
  readonly mode = input<'login' | 'register'>('login');
  /** Query parameters, bound by the router: where to go afterwards, and whether the session ran out. */
  readonly returnUrl = input<string | undefined>(undefined);
  readonly expired = input<string | undefined>(undefined);

  private readonly store = inject(Store);

  protected readonly working = this.store.selectSignal(authFeature.selectWorking);
  protected readonly error = this.store.selectSignal(authFeature.selectError);
  protected readonly isLogin = computed(() => this.mode() === 'login');
  protected readonly queryParams = computed(() => (this.returnUrl() ? { returnUrl: this.returnUrl() } : {}));

  protected readonly form = inject(NonNullableFormBuilder).group({
    // Logging in only asks for something to look up, so accounts created earlier with an email address still work.
    username: ['', [Validators.required, Validators.maxLength(254), (control: AbstractControl) => this.usernameFormat(control)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  constructor() {
    // Switching between login and sign up must not keep an old error message.
    effect(() => {
      this.mode();
      this.store.dispatch(AuthActions.formOpened());
      // The username rules differ between login and sign up.
      this.form.controls.username.updateValueAndValidity();
    });
  }

  /** Sign up only: 3 to 30 letters, digits, dots, underscores or hyphens (the backend checks the same). */
  private usernameFormat(control: AbstractControl): { format: true } | null {
    if (this.isLogin()) {
      return null;
    }
    return /^[A-Za-z0-9_.-]{3,30}$/.test(String(control.value ?? '')) ? null : { format: true };
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.getRawValue();
    this.store.dispatch(
      this.isLogin() ? AuthActions.loginSubmitted({ username, password }) : AuthActions.registerSubmitted({ username, password }),
    );
  }
}
