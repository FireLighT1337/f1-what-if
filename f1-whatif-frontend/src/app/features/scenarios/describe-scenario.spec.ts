import { describeScenario } from './describe-scenario';

const rulesets = [{ code: 'classic-1961', name: '1961-1990' }];
const base = {
  seasonYear: 1984,
  rulesetCode: 'classic-1961',
  includeSprints: true,
  countBest: null,
  excludedDriverIds: [],
  excludedRounds: [],
};

describe('describeScenario', () => {
  it('names the season and the points system', () => {
    expect(describeScenario(base, rulesets)).toBe('1984 · 1961-1990');
  });

  it('adds the options that are set', () => {
    const text = describeScenario(
      { ...base, includeSprints: false, countBest: 11, excludedDriverIds: [1, 2], excludedRounds: [6] },
      rulesets,
    );

    expect(text).toBe('1984 · 1961-1990 · no sprints · best 11 · 3 exclusions');
  });

  it('uses the singular for one exclusion', () => {
    expect(describeScenario({ ...base, excludedRounds: [6] }, rulesets)).toContain('1 exclusion');
    expect(describeScenario({ ...base, excludedRounds: [6] }, rulesets)).not.toContain('exclusions');
  });

  it('falls back to the code while the names are not loaded', () => {
    expect(describeScenario(base, [])).toBe('1984 · classic-1961');
  });
});
