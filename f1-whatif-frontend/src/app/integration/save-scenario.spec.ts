import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { Store, provideState, provideStore } from '@ngrx/store';
import { authFeature } from '../state/auth/auth.reducer';
import { ExplorerActions } from '../state/explorer/explorer.actions';
import { ExplorerEffects } from '../state/explorer/explorer.effects';
import { explorerFeature } from '../state/explorer/explorer.reducer';
import { ReferenceActions } from '../state/reference/reference.actions';
import { ReferenceEffects } from '../state/reference/reference.effects';
import { referenceFeature } from '../state/reference/reference.reducer';
import { ScenariosActions } from '../state/scenarios/scenarios.actions';
import { ScenariosEffects } from '../state/scenarios/scenarios.effects';
import { scenariosFeature } from '../state/scenarios/scenarios.reducer';

describe('saving a scenario (real store, real effects)', () => {
  it('sends the excluded drivers and races that are selected', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideStore(),
        provideState(referenceFeature),
        provideState(explorerFeature),
        provideState(authFeature),
        provideState(scenariosFeature),
        provideEffects(ReferenceEffects, ExplorerEffects, ScenariosEffects),
      ],
    });
    const store = TestBed.inject(Store);
    const http = TestBed.inject(HttpTestingController);

    store.dispatch(
      ReferenceActions.initialLoadSucceeded({
        seasons: [{ year: 1984, raceCount: 16, sprintRaceCount: 0 }],
        rulesets: [{ code: 'classic-1961', name: '1961-1990', description: '' }],
      }),
    );
    store.dispatch(ExplorerActions.driverExclusionToggled({ driverId: 3 }));
    store.dispatch(ExplorerActions.driverExclusionToggled({ driverId: 5 }));
    store.dispatch(ExplorerActions.roundExclusionToggled({ round: 6 }));
    store.dispatch(ExplorerActions.countBestChanged({ value: 11 }));
    store.dispatch(ScenariosActions.saveRequested({ name: 'Without Senna', updateId: null }));

    const request = http.expectOne((r) => r.url === '/api/scenarios' && r.method === 'POST');
    expect(request.request.body).toEqual({
      name: 'Without Senna',
      seasonYear: 1984,
      rulesetCode: 'classic-1961',
      includeSprints: true,
      countBest: 11,
      excludedDriverIds: [3, 5],
      excludedRounds: [6],
    });
  });
});
