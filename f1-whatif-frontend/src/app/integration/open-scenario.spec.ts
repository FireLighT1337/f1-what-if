import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { Store, provideState, provideStore } from '@ngrx/store';
import { ScenarioResponse } from '../core/models';
import { ExplorerPage } from '../features/explorer/explorer-page';
import { authFeature } from '../state/auth/auth.reducer';
import { ExplorerActions } from '../state/explorer/explorer.actions';
import { ExplorerEffects } from '../state/explorer/explorer.effects';
import { explorerFeature } from '../state/explorer/explorer.reducer';
import { ReferenceEffects } from '../state/reference/reference.effects';
import { referenceFeature } from '../state/reference/reference.reducer';
import { scenariosFeature } from '../state/scenarios/scenarios.reducer';

const scenario: ScenarioResponse = {
  id: 7,
  name: 'No Monaco, no Senna',
  seasonYear: 1984,
  rulesetCode: 'classic-1961',
  includeSprints: true,
  countBest: null,
  excludedDriverIds: [3],
  excludedRounds: [6],
  publicId: null,
  createdAt: '2026-11-18T10:00:00Z',
  updatedAt: '2026-11-18T10:00:00Z',
};

const race = (round: number, id: number) => ({
  id, round, name: `Race ${round}`, date: null, circuit: 'C', locality: null, country: null,
  hasSprint: false, shortened: false, shortenedNote: null,
});

describe('opening a saved scenario in the explorer (real store, real effects)', () => {
  it('keeps the excluded drivers and races selected', async () => {
    vi.useFakeTimers();
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
        provideEffects(ReferenceEffects, ExplorerEffects),
      ],
    });
    const store = TestBed.inject(Store);
    const http = TestBed.inject(HttpTestingController);

    // What the scenarios page does when "Open" is clicked, then the explorer page opens.
    store.dispatch(ExplorerActions.scenarioOpened({ scenario, owned: true }));
    const fixture = TestBed.createComponent(ExplorerPage);
    fixture.detectChanges();

    const answer = (url: string, body: object) => {
      for (const request of http.match((r) => r.url === url)) {
        if (!request.cancelled) {
          request.flush(body);
        }
      }
    };
    for (let round = 0; round < 6; round++) {
      answer('/api/seasons', [{ year: 2026, raceCount: 24, sprintRaceCount: 6 }, { year: 1984, raceCount: 16, sprintRaceCount: 0 }]);
      answer('/api/rulesets', [{ code: 'classic-1961', name: '1961-1990', description: '' }]);
      answer('/api/rulesets/classic-1961', {
        code: 'classic-1961', name: '1961-1990', description: '', racePoints: { '1': 9 }, sprintPoints: {},
        fastestLapPoint: 0, fastestLapRequiresTopTen: false, shortenedPolicy: 'NONE',
      });
      answer('/api/seasons/1984/races', [race(5, 55), race(6, 66)]);
      answer('/api/seasons/1984/drivers', [
        { id: 1, code: 'LAU', name: 'Niki Lauda', nationality: null, teams: ['McLaren'] },
        { id: 3, code: 'SEN', name: 'Ayrton Senna', nationality: null, teams: ['Toleman'] },
      ]);
      vi.advanceTimersByTime(300);
      answer('/api/seasons/1984/standings', { season: 1984, ruleset: 'classic-1961', standings: [] });
      await Promise.resolve();
      fixture.detectChanges();
    }

    const state = store.selectSignal(explorerFeature.selectExplorerState)();
    expect(state.season).toBe(1984);
    expect(state.excludedDriverIds).toEqual([3]);
    expect(state.excludedRounds).toEqual([6]);

    const ticked = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('fieldset input[type="checkbox"]')).map(
      (box) => box.checked,
    );
    expect(ticked).toEqual([false, true, false, true]);
    vi.useRealTimers();
  });
});
