import { ScenarioParams } from './models';
import { fromQueryParams, scenarioKey, toQueryParams } from './scenario-query';

const full: ScenarioParams = {
  ruleset: 'classic-1961',
  includeSprints: false,
  countBest: 11,
  excludeDrivers: [5, 2],
  excludeRounds: [7, 3],
};

describe('scenario query parameters', () => {
  it('writes every setting, with the exclusions sorted', () => {
    expect(toQueryParams(full)).toEqual({
      ruleset: 'classic-1961',
      includeSprints: 'false',
      countBest: '11',
      excludeDrivers: '2,5',
      excludeRounds: '3,7',
    });
  });

  it('leaves out what is not set', () => {
    const query = toQueryParams({ ruleset: 'x', includeSprints: true, countBest: null, excludeDrivers: [], excludeRounds: [] });

    expect(query).toEqual({ ruleset: 'x', includeSprints: 'true' });
  });

  it('reads back what it wrote', () => {
    expect(fromQueryParams(toQueryParams(full))).toEqual({ ...full, excludeDrivers: [2, 5], excludeRounds: [3, 7] });
  });

  it('has no scenario without a points system', () => {
    expect(fromQueryParams({})).toBeNull();
    expect(fromQueryParams({ ruleset: '' })).toBeNull();
    expect(fromQueryParams({ includeSprints: 'false' })).toBeNull();
  });

  it('uses defaults for settings that are missing', () => {
    expect(fromQueryParams({ ruleset: 'x' })).toEqual({
      ruleset: 'x',
      includeSprints: true,
      countBest: null,
      excludeDrivers: [],
      excludeRounds: [],
    });
  });

  it('ignores values that are not positive whole numbers', () => {
    const params = fromQueryParams({ ruleset: 'x', countBest: 'abc', excludeDrivers: '3,x,-1,0,4.5,3', excludeRounds: ',' });

    expect(params?.countBest).toBeNull();
    expect(params?.excludeDrivers).toEqual([3]);
    expect(params?.excludeRounds).toEqual([]);
    expect(fromQueryParams({ ruleset: 'x', countBest: '0' })?.countBest).toBeNull();
  });

  it('takes the first value when a parameter is repeated', () => {
    expect(fromQueryParams({ ruleset: ['a', 'b'] })?.ruleset).toBe('a');
  });

  it('gives equal scenarios equal keys, whatever the order of the exclusions', () => {
    expect(scenarioKey({ ...full, excludeDrivers: [2, 5] })).toBe(scenarioKey(full));
    expect(scenarioKey({ ...full, countBest: null })).not.toBe(scenarioKey(full));
  });
});
