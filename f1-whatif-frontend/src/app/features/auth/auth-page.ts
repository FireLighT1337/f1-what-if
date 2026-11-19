import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  constructor() {
    // Switching between login and sign up must not keep an old error message.
    effect(() => {
      this.mode();
      this.store.dispatch(AuthActions.formOpened());
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.store.dispatch(
      this.isLogin() ? AuthActions.loginSubmitted({ email, password }) : AuthActions.registerSubmitted({ email, password }),
    );
  }
}
