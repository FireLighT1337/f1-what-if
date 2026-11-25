import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from './state/auth/auth.actions';
import { ExplorerActions } from './state/explorer/explorer.actions';
import { referenceFeature } from './state/reference/reference.reducer';
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
  private readonly seasons = this.store.selectSignal(referenceFeature.selectSeasons);
  private readonly rulesets = this.store.selectSignal(referenceFeature.selectRulesets);
  currentYear = new Date().getFullYear();

  /** The logo and the Explorer link start the explorer over with the default settings. */
  protected resetExplorer(): void {
    this.store.dispatch(ExplorerActions.defaultsRestored({ seasons: this.seasons(), rulesets: this.rulesets() }));
  }

  protected logout(): void {
    this.store.dispatch(AuthActions.logoutClicked());
  }
}
