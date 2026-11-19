import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from './state/auth/auth.actions';
import { authFeature } from './state/auth/auth.reducer';
import { selectIsLoggedIn } from './state/auth/auth.selectors';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly store = inject(Store);

  protected readonly loggedIn = this.store.selectSignal(selectIsLoggedIn);
  protected readonly user = this.store.selectSignal(authFeature.selectUser);
  currentYear = new Date().getFullYear();

  protected logout(): void {
    this.store.dispatch(AuthActions.logoutClicked());
  }
}
