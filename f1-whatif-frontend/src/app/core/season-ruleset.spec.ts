import { rulesetCodeForSeason, rulesetForSeason } from './season-ruleset';

describe('season ruleset', () => {
  it.each([
    [2026, 'current-2025'],
    [2025, 'current-2025'],
    [2024, 'fl-2019-2024'],
    [2022, 'fl-2019-2024'],
    [2021, 'sprint-2021'],
    [2019, 'fl-2019-2024'],
    [2018, 'modern-2010'],
    [2010, 'modern-2010'],
    [2009, 'classic-2003'],
    [2003, 'classic-2003'],
    [2002, 'classic-1991'],
    [1991, 'classic-1991'],
    [1990, 'classic-1961'],
    [1980, 'classic-1961'],
    [1961, 'classic-1961'],
  ])('uses the points system of %i: %s', (year, code) => {
    expect(rulesetCodeForSeason(year)).toBe(code);
  });

  it('returns null when the backend does not offer that points system', () => {
    expect(rulesetForSeason(1980, [{ code: 'current-2025' }])).toBeNull();
    expect(rulesetForSeason(1980, [{ code: 'classic-1961' }])).toBe('classic-1961');
  });
});
