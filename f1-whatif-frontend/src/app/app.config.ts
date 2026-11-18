import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { DriverEffects } from './state/driver/driver.effects';
import { driverFeature } from './state/driver/driver.reducer';
import { ExplorerEffects } from './state/explorer/explorer.effects';
import { explorerFeature } from './state/explorer/explorer.reducer';
import { ReferenceEffects } from './state/reference/reference.effects';
import { referenceFeature } from './state/reference/reference.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Route parameters (:year, :driverId) are handed to the page component as inputs.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideStore(),
    provideState(referenceFeature),
    provideState(explorerFeature),
    provideState(driverFeature),
    provideEffects(ReferenceEffects, ExplorerEffects, DriverEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
