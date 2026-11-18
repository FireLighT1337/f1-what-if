import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { DriverPhoto, DriverSeasonResponse } from '../../core/models';
import { DriverActions } from '../../state/driver/driver.actions';
import { DriverState, driverKey, initialDriverState } from '../../state/driver/driver.reducer';
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
      round: 1, raceName: 'Brazilian Grand Prix', date: '1984-03-25', shortened: false, entered: true, team: 'McLaren',
      grid: 2, finishPosition: 1, positionText: '1', status: 'Finished', points: 9, sprint: null,
    },
    {
      round: 2, raceName: 'South African Grand Prix', date: '1984-04-07', shortened: false, entered: false, team: null,
      grid: null, finishPosition: null, positionText: null, status: null, points: null, sprint: null,
    },
    {
      round: 6, raceName: 'Monaco Grand Prix', date: '1984-06-03', shortened: true, entered: true, team: 'McLaren',
      grid: 1, finishPosition: null, positionText: 'R', status: 'Engine', points: 4.5, sprint: null,
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
  function create(state: Partial<DriverState>, inputs: Record<string, string> = { year: '1984', driverId: '2' }) {
    TestBed.configureTestingModule({
      imports: [DriverPage],
      providers: [provideRouter([]), provideMockStore({ initialState: { driver: { ...initialDriverState, ...state } } })],
    });
    const fixture = TestBed.createComponent(DriverPage);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement, store: TestBed.inject(MockStore) };
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
    expect(element.querySelector(`a[href="${photo.sourceUrl}"]`)?.textContent).toContain('Wikimedia Commons');
  });

  it('shows initials when no photo exists', async () => {
    const none: DriverPhoto = { photoUrl: null, sourceUrl: null, articleUrl: null, width: null, height: null };
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

    expect(element.querySelector('a[href="https://en.wikipedia.org/wiki/Alain_Prost"]')).not.toBeNull();
  });

  it('shows the error and lets the user try again', async () => {
    const { fixture, element, store } = create({
      current: { year: 1984, driverId: 2 },
      entries: { [driverKey(1984, 2)]: { status: 'error', data: null, error: 'This driver did not take part in that season.' } },
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

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('does not point to a driver');
    expect(dispatch).not.toHaveBeenCalled();
  });
});
