import { createSelector } from '@ngrx/store';
import { RaceInfo, RulesetDetail, SeasonDriver, StandingsQuery } from '../../core/models';
import { referenceFeature } from '../reference/reference.reducer';
import { explorerFeature } from './explorer.reducer';

export const selectSelectedRaces = createSelector(
  explorerFeature.selectSeason,
  referenceFeature.selectRacesBySeason,
  (season, racesBySeason): RaceInfo[] => (season === null ? [] : (racesBySeason[season] ?? [])),
);

export const selectSelectedDrivers = createSelector(
  explorerFeature.selectSeason,
  referenceFeature.selectDriversBySeason,
  (season, driversBySeason): SeasonDriver[] => (season === null ? [] : (driversBySeason[season] ?? [])),
);

export const selectSelectedRulesetDetail = createSelector(
  explorerFeature.selectRulesetCode,
  referenceFeature.selectRulesetDetails,
  (code, details): RulesetDetail | null => (code === null ? null : (details[code] ?? null)),
);

/**
 * The request for the standings endpoint, or null while the selection is incomplete.
 * The user excludes races by round; the endpoint wants database ids, so rounds are translated here.
 */
export const selectStandingsQuery = createSelector(
  explorerFeature.selectSeason,
  explorerFeature.selectRulesetCode,
  explorerFeature.selectIncludeSprints,
  explorerFeature.selectCountBest,
  explorerFeature.selectExcludedDriverIds,
  explorerFeature.selectExcludedRounds,
  selectSelectedRaces,
  (season, ruleset, includeSprints, countBest, excludedDriverIds, excludedRounds, races): StandingsQuery | null => {
    if (season === null || ruleset === null) {
      return null;
    }
    const idByRound = new Map(races.map((race) => [race.round, race.id]));
    const excludeRaces = excludedRounds
      .map((round) => idByRound.get(round))
      .filter((id): id is number => id !== undefined && id !== null);
    return {
      year: season,
      ruleset,
      includeSprints,
      countBest,
      excludeDrivers: excludedDriverIds,
      excludeRaces,
    };
  },
);
