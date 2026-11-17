import { TestBed } from '@angular/core/testing';
import { RaceInfo, RulesetDetail, SeasonDriver } from '../../core/models';
import { SettingsPanel, ordinal } from './settings-panel';

const drivers: SeasonDriver[] = [
  { id: 1, code: 'LAU', name: 'Niki Lauda', nationality: 'Austrian', teams: ['McLaren'] },
  { id: 2, code: 'PRO', name: 'Alain Prost', nationality: 'French', teams: ['McLaren'] },
  { id: 3, code: 'SEN', name: 'Ayrton Senna', nationality: 'Brazilian', teams: ['Toleman', 'Lotus'] },
];

function race(round: number, extra: Partial<RaceInfo> = {}): RaceInfo {
  return {
    id: round * 10,
    round,
    name: `Race ${round}`,
    date: null,
    circuit: 'Circuit',
    locality: null,
    country: null,
    hasSprint: false,
    shortened: false,
    shortenedNote: null,
    ...extra,
  };
}

const detail: RulesetDetail = {
  code: 'classic-1961',
  name: '1961-1990',
  description: '9-6-4-3-2-1',
  racePoints: { '2': 6, '1': 9, '10': 1 },
  sprintPoints: {},
  fastestLapPoint: 0,
  fastestLapRequiresTopTen: false,
  shortenedPolicy: 'HALF_1980',
};

describe('SettingsPanel', () => {
  function create(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(SettingsPanel);
    const base: Record<string, unknown> = {
      seasons: [
        { year: 1984, raceCount: 16, sprintRaceCount: 0 },
        { year: 1983, raceCount: 15, sprintRaceCount: 0 },
      ],
      rulesets: [{ code: 'classic-1961', name: '1961-1990', description: '9-6-4-3-2-1' }],
      drivers,
      races: [race(1), race(2)],
      season: 1984,
      rulesetCode: 'classic-1961',
    };
    for (const [name, value] of Object.entries({ ...base, ...inputs })) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement, panel: fixture.componentInstance };
  }

  it('reports the chosen season as a number', () => {
    const { element, panel } = create();
    const seasons: number[] = [];
    panel.seasonChange.subscribe((year) => seasons.push(year));

    const select = element.querySelector<HTMLSelectElement>('#season')!;
    select.value = '1983';
    select.dispatchEvent(new Event('change'));

    expect(seasons).toEqual([1983]);
  });

  it('reports a driver that is ticked', () => {
    const { element, panel } = create();
    const toggled: number[] = [];
    panel.driverToggle.subscribe((id) => toggled.push(id));

    const boxes = element.querySelectorAll<HTMLInputElement>('fieldset:nth-of-type(1) input[type="checkbox"]');
    boxes[1].click();

    expect(toggled).toEqual([2]);
  });

  it('shows the exclusions that are currently set as ticked', () => {
    const { element } = create({ excludedDriverIds: [3], excludedRounds: [2] });

    const ticked = Array.from(element.querySelectorAll<HTMLInputElement>('fieldset input[type="checkbox"]')).map(
      (box) => box.checked,
    );
    expect(ticked).toEqual([false, false, true, false, true]);
  });

  it('filters the driver list by name or team', () => {
    const { element, fixture } = create();

    const filter = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    filter.value = 'lotus';
    filter.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const names = Array.from(element.querySelectorAll('fieldset:nth-of-type(1) li')).map((li) => li.textContent);
    expect(names).toHaveLength(1);
    expect(names[0]).toContain('Ayrton Senna');
  });

  it('marks sprint and shortened races', () => {
    const { element } = create({ races: [race(1, { hasSprint: true }), race(2, { shortened: true, shortenedNote: 'Half points' })] });

    const text = element.textContent ?? '';
    expect(text).toContain('Sprint');
    expect(text).toContain('Shortened');
  });

  it('disables the sprint option for a season without sprints', () => {
    const { element } = create({ races: [race(1)] });

    const sprints = Array.from(element.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')).find((box) =>
      box.closest('label')?.textContent?.includes('Count sprint races'),
    )!;
    expect(sprints.disabled).toBe(true);
    expect(element.textContent).toContain('no sprint races');
  });

  it('starts "best results" at two fewer than the number of rounds', () => {
    const { element, panel } = create({ races: [race(1), race(2), race(3), race(4), race(5)] });
    const values: (number | null)[] = [];
    panel.countBestChange.subscribe((value) => values.push(value));

    const box = Array.from(element.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')).find((b) =>
      b.closest('label')?.textContent?.includes('best results'),
    )!;
    box.click();

    expect(values).toEqual([3]);
  });

  it('lists the points table in order of position', () => {
    const { element } = create({ rulesetDetail: detail });

    const entries = Array.from(element.querySelectorAll('details li')).map((li) =>
      Array.from(li.querySelectorAll('span'))
        .map((span) => span.textContent)
        .join(' '),
    );
    expect(entries).toEqual(['1st 9', '2nd 6', '10th 1']);
    expect(element.textContent).toContain('half points');
  });

  it('formats ordinals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 111].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '101st', '111th',
    ]);
  });
});
