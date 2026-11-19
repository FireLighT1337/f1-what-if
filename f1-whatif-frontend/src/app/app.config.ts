import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { Store, provideState, provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { TokenStorage } from './core/token-storage';
import { AuthActions } from './state/auth/auth.actions';
import { AuthEffects } from './state/auth/auth.effects';
import { authFeature } from './state/auth/auth.reducer';
import { DriverEffects } from './state/driver/driver.effects';
import { driverFeature } from './state/driver/driver.reducer';
import { ExplorerEffects } from './state/explorer/explorer.effects';
import { explorerFeature } from './state/explorer/explorer.reducer';
import { ReferenceEffects } from './state/reference/reference.effects';
import { referenceFeature } from './state/reference/reference.reducer';
import { ScenariosEffects } from './state/scenarios/scenarios.effects';
import { scenariosFeature } from './state/scenarios/scenarios.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Route parameters (:year, :driverId) and query parameters are handed to the page component as inputs.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideStore(),
    provideState(referenceFeature),
    provideState(explorerFeature),
    provideState(driverFeature),
    provideState(authFeature),
    provideState(scenariosFeature),
    provideEffects(ReferenceEffects, ExplorerEffects, DriverEffects, AuthEffects, ScenariosEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    // Restores a saved login before the first page is shown, so a reload does not log the user out.
    provideAppInitializer(() => {
      const session = inject(TokenStorage).load();
      if (session !== null) {
        inject(Store).dispatch(AuthActions.sessionRestored(session));
      }
    }),
  ],
};
