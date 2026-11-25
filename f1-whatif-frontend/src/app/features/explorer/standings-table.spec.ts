import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StandingRow } from '../../core/models';
import { StandingsTable } from './standings-table';

function row(rank: number, driver: string, points: number, positionChange: number | null): StandingRow {
  return { rank, driverId: rank, driver, points, actualRank: rank, positionChange };
}

describe('StandingsTable', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  function render(inputs: Record<string, unknown>): HTMLElement {
    const fixture = TestBed.createComponent(StandingsTable);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows one row per driver with rank, name and points', () => {
    const element = render({ rows: [row(1, 'Niki Lauda', 72, 0), row(2, 'Alain Prost', 71.5, 0)], status: 'loaded' });

    const cells = Array.from(element.querySelectorAll('tbody tr')).map((tr) => tr.textContent?.replace(/\s+/g, ' ').trim());
    expect(cells).toHaveLength(2);
    expect(cells[0]).toContain('Niki Lauda');
    expect(cells[0]).toContain('72');
    expect(cells[1]).toContain('71.5');
  });

  it('shows how far each driver moved compared with the real season', () => {
    const element = render({
      rows: [row(1, 'A', 10, 2), row(2, 'B', 9, -1), row(3, 'C', 8, 0), row(4, 'D', 7, null)],
      status: 'loaded',
    });

    const changes = Array.from(element.querySelectorAll('tbody tr')).map((tr) => tr.lastElementChild?.textContent?.trim());
    expect(changes).toEqual(['▲ 2', '▼ 1', '=', '–']);
  });

  it('describes the change for screen readers', () => {
    const element = render({ rows: [row(1, 'A', 10, 1), row(2, 'B', 9, -2)], status: 'loaded' });

    const labels = Array.from(element.querySelectorAll('tbody span[aria-label]')).map((span) => span.getAttribute('aria-label'));
    expect(labels).toEqual(['1 place better than in reality', '2 places worse than in reality']);
  });

  it('shows an alert instead of the table when there is an error', () => {
    const element = render({ rows: [], status: 'error', error: 'No data found for this selection.' });

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('No data found');
    expect(element.querySelector('table')).toBeNull();
  });

  it('shows placeholders while the first standings load', () => {
    const element = render({ rows: [], status: 'loading' });

    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.querySelector('table')).toBeNull();
  });

  it('dims the old standings while new ones are calculated', () => {
    const element = render({ rows: [row(1, 'A', 10, 0)], status: 'loading' });

    expect(element.querySelector('table')).not.toBeNull();
    expect(element.querySelector('.opacity-50')).not.toBeNull();
  });

  it('links each driver to their page for that season', () => {
    const element = render({ rows: [row(1, 'Niki Lauda', 72, 0)], season: 1984, status: 'loaded' });

    const link = element.querySelector('tbody a');
    expect(link?.textContent?.trim()).toBe('Niki Lauda');
    expect(link?.getAttribute('href')).toBe('/seasons/1984/drivers/1');
  });

  it('shows plain names when the season is not known', () => {
    const element = render({ rows: [row(1, 'Niki Lauda', 72, 0)], status: 'loaded' });

    expect(element.querySelector('tbody a')).toBeNull();
    expect(element.querySelector('tbody')?.textContent).toContain('Niki Lauda');
  });

  it('hands the scenario settings on to the driver links', () => {
    const element = render({
      rows: [row(1, 'Niki Lauda', 72, 0)],
      season: 1984,
      queryParams: { ruleset: 'classic-1961', includeSprints: 'true', excludeRounds: '3' },
      status: 'loaded',
    });

    expect(element.querySelector('tbody a')?.getAttribute('href')).toBe(
      '/seasons/1984/drivers/1?ruleset=classic-1961&includeSprints=true&excludeRounds=3',
    );
  });

  it('links to the plain driver page when there are no settings', () => {
    const element = render({ rows: [row(1, 'Niki Lauda', 72, 0)], season: 1984, status: 'loaded' });

    expect(element.querySelector('tbody a')?.getAttribute('href')).toBe('/seasons/1984/drivers/1');
  });
});
