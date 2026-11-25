package com.f1whatif.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import org.junit.jupiter.api.Test;

class CountingRuleTest {

    private static final double DELTA = 0.0001;

    private static Map<Integer, Double> rounds(double... points) {
        Map<Integer, Double> map = new TreeMap<>();
        for (int i = 0; i < points.length; i++) {
            map.put(i + 1, points[i]);
        }
        return map;
    }

    @Test
    void allCountsEveryRound() {
        assertEquals(10.0, CountingRule.ALL.total(rounds(4, 3, 2, 1)), DELTA);
    }

    @Test
    void bestKeepsTheHighestRoundsAndSettlesTiesByEarlierRound() {
        Map<Integer, Double> points = rounds(5, 9, 5, 9);
        assertEquals(Set.of(2, 4), CountingRule.best(2).countedRounds(points));
        assertEquals(Set.of(2, 4, 1), CountingRule.best(3).countedRounds(points));
        assertEquals(28.0, CountingRule.best(10).total(points), DELTA);
    }

    @Test
    void bestRejectsLessThanOne() {
        assertThrows(IllegalArgumentException.class, () -> CountingRule.best(0));
    }

    @Test
    void splitCountsBestOfEachPartSeparately() {
        // first part rounds 1-3 (best 2), second part rounds 4-6 (best 1)
        Map<Integer, Double> points = rounds(9, 6, 4, 1, 3, 2);
        CountingRule rule = CountingRule.split(3, 2, 1);
        assertEquals(Set.of(1, 2, 5), rule.countedRounds(points));
        assertEquals(18.0, rule.total(points), DELTA);
    }

    @Test
    void splitDoesNotLetOneStrongPartFillTheOther() {
        // a driver who only scored in the first part cannot use the second part's allowance
        Map<Integer, Double> points = rounds(9, 8, 7, 6);
        assertEquals(17.0, CountingRule.split(4, 2, 5).total(points), DELTA);
        assertEquals(Set.of(1, 2), CountingRule.split(4, 2, 5).countedRounds(points));
    }

    @Test
    void splitWithFewerRoundsThanAllowedCountsAll() {
        assertEquals(6.0, CountingRule.split(2, 5, 5).total(rounds(1, 2, 3)), DELTA);
    }

    @Test
    void multiplierDoublesRacePointsOnlyAndLeavesSprintsAlone() {
        ScoringRules rules = new ScoringRules(Map.of(1, 25.0, 2, 18.0), Map.of(1, 8.0), 0.0, false);
        StandingsCalculator calculator = new StandingsCalculator();
        List<ResultEntry> results = List.of(
                new ResultEntry(1, 1, 1, 1, false, false), new ResultEntry(1, 1, 2, 2, false, false),
                new ResultEntry(2, 2, 2, 1, false, false), new ResultEntry(2, 2, 1, 2, false, false),
                new ResultEntry(2, 2, 2, 1, false, true));

        List<StandingRow> plain = calculator.driverStandings(results, rules, ScoringOptions.defaults());
        List<StandingRow> doubled = calculator.driverStandings(
                results, rules, ScoringOptions.defaults(), Map.of(), Map.of(2, 2.0));

        assertEquals(18 + 25 + 8, plain.get(0).points(), DELTA);          // driver 2
        assertEquals(18 + 50 + 8, doubled.get(0).points(), DELTA);        // sprint stays 8
        assertEquals(25 + 36, doubled.get(1).points(), DELTA);            // driver 1
    }

    @Test
    void splitRuleAppliesInStandingsAndBreakdown() {
        ScoringRules rules = new ScoringRules(Map.of(1, 10.0, 2, 6.0, 3, 1.0), Map.of(), 0.0, false);
        StandingsCalculator calculator = new StandingsCalculator();
        ScoringOptions options = new ScoringOptions(true, CountingRule.split(2, 1, 1), Set.of(), Set.of());
        List<ResultEntry> results = List.of(
                new ResultEntry(1, 1, 1, 1, false, false), new ResultEntry(2, 2, 1, 2, false, false),
                new ResultEntry(3, 3, 1, 3, false, false), new ResultEntry(4, 4, 1, 1, false, false));

        assertEquals(20.0, calculator.driverStandings(results, rules, options).get(0).points(), DELTA);

        DriverBreakdown breakdown = calculator.driverBreakdown(results, rules, options, Map.of(), 1L);
        assertEquals(List.of(true, false, false, true), breakdown.rounds().stream().map(RoundBreakdown::counted).toList());
    }
}
