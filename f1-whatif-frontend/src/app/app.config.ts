import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { ExplorerEffects } from './state/explorer/explorer.effects';
import { explorerFeature } from './state/explorer/explorer.reducer';
import { ReferenceEffects } from './state/reference/reference.effects';
import { referenceFeature } from './state/reference/reference.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideStore(),
    provideState(referenceFeature),
    provideState(explorerFeature),
    provideEffects(ReferenceEffects, ExplorerEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
