import { ScenarioParams } from './models';

type Raw = Record<string, unknown>;

function sortedUnique(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

/** The scenario as address query parameters, in a fixed order so equal scenarios give equal links. */
export function toQueryParams(params: ScenarioParams): Record<string, string> {
  const query: Record<string, string> = {
    ruleset: params.ruleset,
    includeSprints: String(params.includeSprints),
  };
  if (params.countBest !== null) {
    query['countBest'] = String(params.countBest);
  }
  if (params.excludeDrivers.length > 0) {
    query['excludeDrivers'] = sortedUnique(params.excludeDrivers).join(',');
  }
  if (params.excludeRounds.length > 0) {
    query['excludeRounds'] = sortedUnique(params.excludeRounds).join(',');
  }
  return query;
}

function text(value: unknown): string | null {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === 'string' && single !== '' ? single : null;
}

function positiveIntegers(value: unknown): number[] {
  const raw = text(value);
  if (raw === null) {
    return [];
  }
  const numbers = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => /^\d+$/.test(part))
    .map(Number)
    .filter((n) => n > 0);
  return sortedUnique(numbers);
}

/** Reads the scenario from query parameters; null when there is no points system, i.e. no scenario. */
export function fromQueryParams(query: Raw): ScenarioParams | null {
  const ruleset = text(query['ruleset']);
  if (ruleset === null) {
    return null;
  }
  const countBest = text(query['countBest']);
  const best = countBest !== null && /^\d+$/.test(countBest) && Number(countBest) >= 0 ? Number(countBest) : null;
  return {
    ruleset,
    includeSprints: text(query['includeSprints']) !== 'false',
    countBest: best,
    excludeDrivers: positiveIntegers(query['excludeDrivers']),
    excludeRounds: positiveIntegers(query['excludeRounds']),
  };
}

/** One string per distinct scenario, used to keep results apart in the store. */
export function scenarioKey(params: ScenarioParams): string {
  return Object.entries(toQueryParams(params))
    .map(([name, value]) => `${name}=${value}`)
    .join('&');
}
