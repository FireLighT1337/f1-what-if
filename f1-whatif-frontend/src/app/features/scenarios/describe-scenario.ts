import { RulesetSummary, ScenarioRequest } from '../../core/models';

/** One line about a scenario's settings, such as "1984 · 1961-1990 · best 11 · 2 exclusions". */
export function describeScenario(
  scenario: Pick<
    ScenarioRequest,
    'seasonYear' | 'rulesetCode' | 'includeSprints' | 'countBest' | 'excludedDriverIds' | 'excludedRounds'
  >,
  rulesets: Pick<RulesetSummary, 'code' | 'name'>[],
): string {
  const rulesetName = rulesets.find((ruleset) => ruleset.code === scenario.rulesetCode)?.name ?? scenario.rulesetCode;
  const exclusions = scenario.excludedDriverIds.length + scenario.excludedRounds.length;
  const parts = [
    String(scenario.seasonYear),
    rulesetName,
    scenario.includeSprints ? null : 'no sprints',
    scenario.countBest === null ? null : `best ${scenario.countBest}`,
    exclusions === 0 ? null : `${exclusions} exclusion${exclusions === 1 ? '' : 's'}`,
  ];
  return parts.filter((part): part is string => part !== null).join(' · ');
}
