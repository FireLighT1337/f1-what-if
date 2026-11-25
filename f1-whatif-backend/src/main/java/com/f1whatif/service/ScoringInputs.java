package com.f1whatif.service;

import com.f1whatif.entity.RaceMultiplier;
import com.f1whatif.entity.RaceResult;
import com.f1whatif.entity.ScoringRuleset;
import com.f1whatif.entity.SeasonRule;
import com.f1whatif.entity.SessionType;
import com.f1whatif.entity.ShortenedRace;
import com.f1whatif.scoring.CountingRule;
import com.f1whatif.scoring.RaceDistance;
import com.f1whatif.scoring.ResultEntry;
import com.f1whatif.scoring.ScoringRules;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Turns database objects into the plain data the scoring engine works with. */
final class ScoringInputs {

    private ScoringInputs() {
    }

    static ResultEntry entry(RaceResult r) {
        return new ResultEntry(
                r.getRace().getId(),
                r.getRace().getRound(),
                r.getDriver().getId(),
                r.getFinishPosition(),
                r.getFastestLapRank() != null && r.getFastestLapRank() == 1,
                r.getSessionType() == SessionType.SPRINT);
    }

    static ScoringRules rules(ScoringRuleset ruleset) {
        return new ScoringRules(
                toDoubles(ruleset.getRacePoints()),
                toDoubles(ruleset.getSprintPoints()),
                ruleset.getFastestLapPoint().doubleValue(),
                ruleset.isFastestLapRequiresTopTen(),
                ruleset.getShortenedPolicy());
    }

    /**
     * The counting rule for a request: null = the season's real rule, 0 = all results, N = best N round totals.
     *
     * @param seasonRule the season's real rule, or null for seasons in which every result counted
     */
    static CountingRule counting(Integer countBest, SeasonRule seasonRule) {
        if (countBest != null) {
            return countBest == 0 ? CountingRule.ALL : CountingRule.best(countBest);
        }
        return seasonCounting(seasonRule);
    }

    /** The rule that counted in the real championship of the season. */
    static CountingRule seasonCounting(SeasonRule seasonRule) {
        if (seasonRule == null) {
            return CountingRule.ALL;
        }
        if (seasonRule.getBestOverall() != null) {
            return CountingRule.best(seasonRule.getBestOverall());
        }
        if (seasonRule.getSplitAfterRound() != null && seasonRule.getBestFirst() != null
                && seasonRule.getBestSecond() != null) {
            return CountingRule.split(seasonRule.getSplitAfterRound(), seasonRule.getBestFirst(),
                    seasonRule.getBestSecond());
        }
        return CountingRule.ALL;
    }

    /** Round -> factor for the race points of that round. */
    static Map<Integer, Double> multipliers(List<RaceMultiplier> multipliers) {
        Map<Integer, Double> out = new HashMap<>();
        for (RaceMultiplier multiplier : multipliers) {
            out.put(multiplier.getRound(), multiplier.getMultiplier().doubleValue());
        }
        return out;
    }

    /** Race id -> distance, for the races of the season that ended early. */
    static Map<Long, RaceDistance> distances(List<RaceResult> rows, List<ShortenedRace> shortenedRaces) {
        Map<Integer, ShortenedRace> byRound = new HashMap<>();
        for (ShortenedRace shortened : shortenedRaces) {
            byRound.put(shortened.getRound(), shortened);
        }
        Map<Long, RaceDistance> distances = new HashMap<>();
        for (RaceResult row : rows) {
            ShortenedRace shortened = byRound.get(row.getRace().getRound());
            if (shortened != null) {
                distances.putIfAbsent(row.getRace().getId(), new RaceDistance(
                        shortened.getScheduledLaps(), shortened.getCompletedLaps(), shortened.getRacingLaps()));
            }
        }
        return distances;
    }

    /** The ids of the races with the given round numbers. */
    static Set<Long> raceIdsOfRounds(List<RaceResult> rows, Set<Integer> rounds) {
        Set<Long> ids = new HashSet<>();
        if (rounds.isEmpty()) {
            return ids;
        }
        for (RaceResult row : rows) {
            if (rounds.contains(row.getRace().getRound())) {
                ids.add(row.getRace().getId());
            }
        }
        return ids;
    }

    private static Map<Integer, Double> toDoubles(Map<Integer, BigDecimal> source) {
        Map<Integer, Double> out = new HashMap<>();
        source.forEach((position, points) -> out.put(position, points.doubleValue()));
        return out;
    }
}
