import { RulesetSummary } from './models';

/** The code of the preset points system that was used in a season. */
export function rulesetCodeForSeason(year: number): string {
  if (year >= 2025) return 'current-2025';
  if (year === 2021) return 'sprint-2021';
  if (year >= 2019) return 'fl-2019-2024';
  if (year >= 2010) return 'modern-2010';
  if (year >= 2003) return 'classic-2003';
  if (year >= 1991) return 'classic-1991';
  return 'classic-1961';
}

/** The season's own points system if the backend offers it, otherwise null (keep the current one). */
export function rulesetForSeason(year: number, rulesets: Pick<RulesetSummary, 'code'>[]): string | null {
  const code = rulesetCodeForSeason(year);
  return rulesets.some((ruleset) => ruleset.code === code) ? code : null;
}
