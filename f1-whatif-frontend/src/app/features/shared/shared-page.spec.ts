import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ScenarioResponse, StandingsResponse } from '../../core/models';
import { ExplorerActions } from '../../state/explorer/explorer.actions';
import { ReferenceActions } from '../../state/reference/reference.actions';
import { initialReferenceState } from '../../state/reference/reference.reducer';
import { ScenariosActions } from '../../state/scenarios/scenarios.actions';
import { SharedEntry, initialScenariosState } from '../../state/scenarios/scenarios.reducer';
import { SharedPage } from './shared-page';

const scenario: ScenarioResponse = {
  id: 7,
  name: 'No Monaco',
  seasonYear: 1984,
  rulesetCode: 'classic-1961',
  includeSprints: true,
  countBest: null,
  excludedDriverIds: [],
  excludedRounds: [6],
  publicId: 'abc',
  createdAt: '2026-11-18T10:00:00Z',
  updatedAt: '2026-11-18T10:00:00Z',
};

const standings: StandingsResponse = {
  season: 1984,
  ruleset: 'classic-1961',
  standings: [{ rank: 1, driverId: 1, driver: 'Alain Prost', points: 76, actualRank: 2, positionChange: 1 }],
};

describe('SharedPage', () => {
  function create(entry: SharedEntry | null) {
    TestBed.configureTestingModule({
      imports: [SharedPage],
      providers: [
        provideRouter([]),
        provideMockStore({
          initialState: {
            scenarios: { ...initialScenariosState, shared: entry === null ? {} : { abc: entry } },
            reference: {
              ...initialReferenceState,
              rulesets: [{ code: 'classic-1961', name: '1961-1990', description: '' }],
            },
          },
        }),
      ],
    });
    const fixture = TestBed.createComponent(SharedPage);
    fixture.componentRef.setInput('publicId', 'abc');
    const store = TestBed.inject(MockStore);
    const dispatch = vi.spyOn(store, 'dispatch');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement, dispatch, navigate };
  }

  it('asks for the shared scenario by its link id', async () => {
    const { fixture, dispatch } = create(null);
    await fixture.whenStable();

    expect(dispatch).toHaveBeenCalledWith(ScenariosActions.sharedOpened({ publicId: 'abc' }));
    expect(dispatch).toHaveBeenCalledWith(ReferenceActions.rulesetsNeeded());
  });

  it('shows the scenario with its settings and standings', () => {
    const { element } = create({ status: 'loaded', scenario, standings, error: null });

    expect(element.querySelector('h1')?.textContent).toContain('No Monaco');
    expect(element.textContent).toContain('1984 · 1961-1990 · 1 exclusion');
    expect(element.querySelector('tbody')?.textContent).toContain('Alain Prost');
  });

  it('links the drivers to their pages', () => {
    const { element } = create({ status: 'loaded', scenario, standings, error: null });

    expect(element.querySelector('tbody a')?.getAttribute('href')).toBe('/seasons/1984/drivers/1');
  });

  it('shows a placeholder while loading', () => {
    const { element } = create({ status: 'loading', scenario: null, standings: null, error: null });

    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('explains a link that does not work', () => {
    const { element } = create({
      status: 'error',
      scenario: null,
      standings: null,
      error: 'This link is not valid, or the scenario is no longer shared.',
    });

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('not valid');
    expect(element.querySelector('a[href="/explorer"]')).not.toBeNull();
  });

  it('copies the settings into the explorer without making them the visitor’s own scenario', () => {
    const { element, dispatch, navigate } = create({ status: 'loaded', scenario, standings, error: null });

    element.querySelector<HTMLButtonElement>('header button')!.click();

    expect(dispatch).toHaveBeenCalledWith(ExplorerActions.scenarioOpened({ scenario, owned: false }));
    expect(navigate).toHaveBeenCalledWith('/explorer');
  });
});
