import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { DriverPhoto, DriverScenarioResponse, DriverSeasonResponse } from '../../core/models';
import { ReferenceActions } from '../../state/reference/reference.actions';
import { DriverActions } from '../../state/driver/driver.actions';
import {
  DriverState,
  driverKey,
  driverScenarioKey,
  initialDriverState,
} from '../../state/driver/driver.reducer';
import { initialReferenceState } from '../../state/reference/reference.reducer';
import { DriverPage } from './driver-page';

const response: DriverSeasonResponse = {
  driver: {
    id: 2,
    name: 'Alain Prost',
    code: 'PRO',
    nationality: 'French',
    dateOfBirth: '1955-02-24',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Alain_Prost',
  },
  season: 1984,
  summary: { racesEntered: 2, wins: 1, podiums: 1, points: 13.5 },
  races: [
    {
      round: 1,
      raceName: 'Brazilian Grand Prix',
      date: '1984-03-25',
      shortened: false,
      entered: true,
      team: 'McLaren',
      grid: 2,
      finishPosition: 1,
      positionText: '1',
      status: 'Finished',
      points: 9,
      sprint: null,
    },
    {
      round: 2,
      raceName: 'South African Grand Prix',
      date: '1984-04-07',
      shortened: false,
      entered: false,
      team: null,
      grid: null,
      finishPosition: null,
      positionText: null,
      status: null,
      points: null,
      sprint: null,
    },
    {
      round: 6,
      raceName: 'Monaco Grand Prix',
      date: '1984-06-03',
      shortened: true,
      entered: true,
      team: 'McLaren',
      grid: 1,
      finishPosition: null,
      positionText: 'R',
      status: 'Engine',
      points: 4.5,
      sprint: null,
    },
  ],
};

const photo: DriverPhoto = {
  photoUrl: 'https://upload.wikimedia.org/x.jpg',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:x.jpg',
  articleUrl: 'https://en.wikipedia.org/wiki/Alain_Prost',
  width: 320,
  height: 400,
};

describe('DriverPage', () => {
  function create(
    state: Partial<DriverState>,
    inputs: Record<string, string> = { year: '1984', driverId: '2' },
  ) {
    TestBed.configureTestingModule({
      imports: [DriverPage],
      providers: [
        provideRouter([]),
        provideMockStore({
          initialState: {
            driver: { ...initialDriverState, ...state },
            reference: initialReferenceState,
          },
        }),
      ],
    });
    const fixture = TestBed.createComponent(DriverPage);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    return {
      fixture,
      element: fixture.nativeElement as HTMLElement,
      store: TestBed.inject(MockStore),
    };
  }

  const loaded: Partial<DriverState> = {
    current: { year: 1984, driverId: 2 },
    entries: { [driverKey(1984, 2)]: { status: 'loaded', data: response, error: null } },
  };

  it('shows the driver, the season totals and one row per race', async () => {
    const { fixture, element } = create({ ...loaded, photos: { 2: photo } });
    await fixture.whenStable();

    expect(element.querySelector('h1')?.textContent).toContain('Alain Prost');
    expect(element.textContent).toContain('1984 season');
    expect(element.textContent).toContain('French');
    const stats = Array.from(element.querySelectorAll('dd')).map((dd) => dd.textContent?.trim());
    expect(stats).toEqual(['2', '1', '1', '13.5']);
    expect(element.querySelectorAll('tbody tr')).toHaveLength(3);
  });

  it('shows how each race ended', async () => {
    const { fixture, element } = create({ ...loaded, photos: { 2: photo } });
    await fixture.whenStable();

    const rows = Array.from(element.querySelectorAll('tbody tr'));
    expect(rows[0].textContent).toContain('Brazilian Grand Prix');
    expect(rows[0].querySelector('[aria-label="Finished 1st"]')).not.toBeNull();
    expect(rows[1].textContent).toContain('Did not take part');
    expect(rows[2].querySelector('[aria-label="Retired"]')?.textContent?.trim()).toBe('Ret');
    expect(rows[2].textContent).toContain('Engine');
    expect(rows[2].textContent).toContain('Shortened');
  });

  it('shows the photo with a credit link when there is one', async () => {
    const { fixture, element } = create({ ...loaded, photos: { 2: photo } });
    await fixture.whenStable();

    const image = element.querySelector('img');
    expect(image?.getAttribute('src')).toBe(photo.photoUrl);
    expect(image?.getAttribute('alt')).toBe('Photo of Alain Prost');
    expect(element.querySelector(`a[href="${photo.sourceUrl}"]`)?.textContent).toContain(
      'Wikimedia Commons',
    );
  });

  it('shows initials when no photo exists', async () => {
    const none: DriverPhoto = {
      photoUrl: null,
      sourceUrl: null,
      articleUrl: null,
      width: null,
      height: null,
    };
    const { fixture, element } = create({ ...loaded, photos: { 2: none } });
    await fixture.whenStable();

    expect(element.querySelector('img')).toBeNull();
    expect(element.textContent).toContain('AP');
  });

  it('shows a placeholder while the photo is still being looked up', async () => {
    const { fixture, element } = create({ ...loaded });
    await fixture.whenStable();

    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('.animate-pulse')).not.toBeNull();
  });

  it('links to the Wikipedia article', async () => {
    const { fixture, element } = create({ ...loaded });
    await fixture.whenStable();

    expect(
      element.querySelector('a[href="https://en.wikipedia.org/wiki/Alain_Prost"]'),
    ).not.toBeNull();
  });

  it('shows the error and lets the user try again', async () => {
    const { fixture, element, store } = create({
      current: { year: 1984, driverId: 2 },
      entries: {
        [driverKey(1984, 2)]: {
          status: 'error',
          data: null,
          error: 'This driver did not take part in that season.',
        },
      },
    });
    await fixture.whenStable();
    const dispatch = vi.spyOn(store, 'dispatch');

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('did not take part');
    element.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();

    expect(dispatch).toHaveBeenCalledWith(DriverActions.pageOpened({ year: 1984, driverId: 2 }));
  });

  it('asks for the data of the driver in the address', async () => {
    const { fixture, store } = create({}, { year: '1984', driverId: '2' });
    const dispatch = vi.spyOn(store, 'dispatch');

    fixture.componentRef.setInput('driverId', '3');
    await fixture.whenStable();

    expect(dispatch).toHaveBeenCalledWith(DriverActions.pageOpened({ year: 1984, driverId: 3 }));
  });

  it('refuses an address that is not a driver', async () => {
    const { fixture, element, store } = create({}, { year: 'abc', driverId: '2' });
    const dispatch = vi.spyOn(store, 'dispatch');
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'does not point to a driver',
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  describe('under a scenario', () => {
    const inputs = {
      year: '1984',
      driverId: '2',
      ruleset: 'classic-1961',
      includeSprints: 'true',
      excludeRounds: '2,6',
    };
    const params = {
      ruleset: 'classic-1961',
      includeSprints: true,
      countBest: null,
      excludeDrivers: [],
      excludeRounds: [2, 6],
    };
    const scenario: DriverScenarioResponse = {
      driver: response.driver,
      season: 1984,
      rulesetCode: 'classic-1961',
      rulesetName: '1961-1990',
      includeSprints: true,
      countBest: null,
      summary: { rank: 3, points: 27, racesCounted: 1, wins: 1, podiums: 1 },
      races: [
        {
          round: 1,
          raceName: 'Brazilian Grand Prix',
          date: '1984-03-25',
          shortened: false,
          entered: true,
          excluded: false,
          team: 'McLaren',
          grid: 2,
          status: 'Finished',
          realFinishPosition: 2,
          realPositionText: '2',
          finishPosition: 1,
          points: 9,
          counted: true,
          sprint: { realFinishPosition: 3, realPositionText: '3', finishPosition: 2, points: 6 },
        },
        {
          round: 2,
          raceName: 'South African Grand Prix',
          date: '1984-04-07',
          shortened: false,
          entered: false,
          excluded: false,
          team: null,
          grid: null,
          status: null,
          realFinishPosition: null,
          realPositionText: null,
          finishPosition: null,
          points: 0,
          counted: false,
          sprint: null,
        },
        {
          round: 4,
          raceName: 'Spanish Grand Prix',
          date: '1984-05-01',
          shortened: false,
          entered: true,
          excluded: false,
          team: 'McLaren',
          grid: 4,
          status: 'Finished',
          realFinishPosition: 5,
          realPositionText: '5',
          finishPosition: 4,
          points: 3,
          counted: false,
          sprint: null,
        },
        {
          round: 6,
          raceName: 'Monaco Grand Prix',
          date: '1984-06-03',
          shortened: true,
          entered: true,
          excluded: true,
          team: 'McLaren',
          grid: 1,
          status: 'Spun off',
          realFinishPosition: null,
          realPositionText: 'R',
          finishPosition: null,
          points: 0,
          counted: false,
          sprint: null,
        },
      ],
    };
    const scenarioState: Partial<DriverState> = {
      ...loaded,
      currentScenario: { year: 1984, driverId: 2, params },
      scenarioEntries: {
        [driverScenarioKey(1984, 2, params)]: { status: 'loaded', data: scenario, error: null },
      },
    };

    it('shows the scenario, a summary of its settings and the position under it', async () => {
      const { fixture, element } = create(scenarioState, inputs);
      await fixture.whenStable();

      expect(element.querySelector('[data-testid="scenario-banner"]')?.textContent).toContain(
        '1984 · classic-1961 · 2 exclusions',
      );
      const stats = Array.from(element.querySelectorAll('[data-testid="scenario-summary"] dd')).map(
        (dd) => dd.textContent?.trim(),
      );
      expect(stats).toEqual(['3', '1', '1', '1', '27']);
    });

    it('shows real and scenario finish side by side, and marks excluded and dropped races', async () => {
      const { fixture, element } = create(scenarioState, inputs);
      await fixture.whenStable();

      const rows = Array.from(element.querySelectorAll('[data-testid="scenario-table"] tbody tr'));
      expect(rows).toHaveLength(4);
      const first = Array.from(rows[0].querySelectorAll('td')).map((td) =>
        td.textContent?.replace(/\s+/g, ' ').trim(),
      );
      expect(first).toContain('2'); // sprint, real finish is 3rd, scenario 2nd
      expect(rows[0].textContent).toContain('9');
      expect(rows[1].textContent).toContain('Did not take part');
      expect(rows[2].querySelector('[data-testid="dropped-points"]')?.textContent?.trim()).toBe(
        '3',
      );
      expect(rows[3].textContent).toContain('Excluded');
      expect(rows[3].querySelector('[data-testid="dropped-points"]')).toBeNull();
    });

    it('leaves out the sprint column when the scenario has no sprints', async () => {
      const noSprints = {
        ...scenario,
        includeSprints: false,
        races: scenario.races.map((race) => ({ ...race, sprint: null })),
      };
      const { fixture, element } = create(
        {
          ...scenarioState,
          scenarioEntries: {
            [driverScenarioKey(1984, 2, params)]: {
              status: 'loaded',
              data: noSprints,
              error: null,
            },
          },
        },
        inputs,
      );
      await fixture.whenStable();

      const headers = Array.from(element.querySelectorAll('[data-testid="scenario-table"] th')).map(
        (th) => th.textContent?.trim(),
      );
      expect(headers).not.toContain('Sprint');
      expect(headers).toContain('Scenario finish');
    });

    it('switches to the real results and back', async () => {
      const { fixture, element } = create(scenarioState, inputs);
      await fixture.whenStable();
      const buttons = Array.from(
        element.querySelectorAll<HTMLButtonElement>('[aria-label="Results to show"] button'),
      );

      buttons.find((b) => b.textContent?.includes('Real results'))!.click();
      fixture.detectChanges();

      expect(element.querySelector('[data-testid="scenario-table"]')).toBeNull();
      expect(
        Array.from(element.querySelectorAll('dd')).map((dd) => dd.textContent?.trim()),
      ).toEqual(['2', '1', '1', '13.5']);

      buttons.find((b) => b.textContent?.includes('Under this scenario'))!.click();
      fixture.detectChanges();

      expect(element.querySelector('[data-testid="scenario-table"]')).not.toBeNull();
    });

    it('asks for the scenario results and for the points system names', async () => {
      const { fixture, store } = create({}, inputs);
      const dispatch = vi.spyOn(store, 'dispatch');
      await fixture.whenStable();
      fixture.componentRef.setInput('driverId', '3');
      await fixture.whenStable();

      expect(dispatch).toHaveBeenCalledWith(ReferenceActions.rulesetsNeeded());
      expect(dispatch).toHaveBeenCalledWith(
        DriverActions.scenarioPageOpened({ year: 1984, driverId: 3, params }),
      );
    });

    it('shows the real results and an error when the scenario cannot be shown', async () => {
      const { fixture, element, store } = create(
        {
          ...loaded,
          currentScenario: { year: 1984, driverId: 2, params },
          scenarioEntries: {
            [driverScenarioKey(1984, 2, params)]: {
              status: 'error',
              data: null,
              error: 'This driver is excluded in the scenario.',
            },
          },
        },
        inputs,
      );
      await fixture.whenStable();
      const dispatch = vi.spyOn(store, 'dispatch');

      expect(
        element.querySelector('[data-testid="scenario-banner"] [role="alert"]')?.textContent,
      ).toContain('is excluded');
      expect(element.querySelectorAll('tbody tr')).toHaveLength(3); // the real table
      element
        .querySelector<HTMLButtonElement>('[data-testid="scenario-banner"] [role="alert"] button')!
        .click();
      expect(dispatch).toHaveBeenCalledWith(
        DriverActions.scenarioPageOpened({ year: 1984, driverId: 2, params }),
      );
    });

    it('shows no scenario banner without settings in the address', async () => {
      const { fixture, element } = create(loaded);
      await fixture.whenStable();

      expect(element.querySelector('[data-testid="scenario-banner"]')).toBeNull();
    });
  });
});
