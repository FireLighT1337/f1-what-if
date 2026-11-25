package com.f1whatif.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class StandingsCalculatorBreakdownTest {

    private static final double DELTA = 0.0001;
    private static final ScoringRules RULES =
            new ScoringRules(Map.of(1, 25.0, 2, 18.0, 3, 15.0), Map.of(1, 8.0, 2, 7.0), 0.0, false);

    private final StandingsCalculator calculator = new StandingsCalculator();

    private static ResultEntry race(long raceId, int round, long driver, Integer position) {
        return new ResultEntry(raceId, round, driver, position, false, false);
    }

    private static ResultEntry sprint(long raceId, int round, long driver, Integer position) {
        return new ResultEntry(raceId, round, driver, position, false, true);
    }

    @Test
    void listsEveryRoundOfTheDriverWithPositionAndPoints() {
        List<ResultEntry> results = List.of(
                race(1, 1, 1, 1), race(1, 1, 2, 2),
                race(2, 2, 2, 1), race(2, 2, 1, 3));

        DriverBreakdown breakdown = calculator.driverBreakdown(results, RULES, ScoringOptions.defaults(), Map.of(), 1);

        assertEquals(2, breakdown.rounds().size());
        assertEquals(Integer.valueOf(1), breakdown.rounds().get(0).racePosition());
        assertEquals(25.0, breakdown.rounds().get(0).racePoints(), DELTA);
        assertEquals(Integer.valueOf(3), breakdown.rounds().get(1).racePosition());
        assertEquals(15.0, breakdown.rounds().get(1).racePoints(), DELTA);
        assertEquals(40.0, breakdown.points(), DELTA);
        // Driver 2 scored 43, so driver 1 is second.
        assertEquals(2, breakdown.rank());
    }

    @Test
    void excludingADriverMovesTheOthersUpInEveryRace() {
        List<ResultEntry> results = List.of(race(1, 1, 1, 1), race(1, 1, 2, 2), race(1, 1, 3, 3));
        ScoringOptions options = new ScoringOptions(true, CountingRule.ALL, Set.of(1L), Set.of());

        DriverBreakdown breakdown = calculator.driverBreakdown(results, RULES, options, Map.of(), 3);

        assertEquals(Integer.valueOf(2), breakdown.rounds().get(0).racePosition());
        assertEquals(18.0, breakdown.rounds().get(0).racePoints(), DELTA);
        assertEquals(2, breakdown.rank());
    }

    @Test
    void anExcludedDriverHasNoBreakdown() {
        List<ResultEntry> results = List.of(race(1, 1, 1, 1), race(1, 1, 2, 2));
        ScoringOptions options = new ScoringOptions(true, CountingRule.ALL, Set.of(1L), Set.of());

        assertNull(calculator.driverBreakdown(results, RULES, options, Map.of(), 1));
    }

    @Test
    void anExcludedRaceIsLeftOut() {
        List<ResultEntry> results = List.of(race(1, 1, 1, 1), race(2, 2, 1, 1));
        ScoringOptions options = new ScoringOptions(true, CountingRule.ALL, Set.of(), Set.of(2L));

        DriverBreakdown breakdown = calculator.driverBreakdown(results, RULES, options, Map.of(), 1);

        assertEquals(1, breakdown.rounds().size());
        assertEquals(25.0, breakdown.points(), DELTA);
    }

    @Test
    void marksTheRoundsThatDoNotCountWhenOnlyTheBestResultsCount() {
        List<ResultEntry> results = List.of(
                race(1, 1, 1, 1), race(2, 2, 1, 3), race(3, 3, 1, 2), race(4, 4, 1, 3));
        ScoringOptions options = new ScoringOptions(true, CountingRule.best(2), Set.of(), Set.of());

        DriverBreakdown breakdown = calculator.driverBreakdown(results, RULES, options, Map.of(), 1);

        List<Boolean> counted = breakdown.rounds().stream().map(RoundBreakdown::counted).toList();
        assertEquals(List.of(true, false, true, false), counted);
        assertEquals(43.0, breakdown.points(), DELTA);
    }

    @Test
    void addsTheSprintToTheRoundAndKeepsItApart() {
        List<ResultEntry> results = List.of(race(1, 1, 1, 2), sprint(1, 1, 1, 1));

        RoundBreakdown round = calculator.driverBreakdown(results, RULES, ScoringOptions.defaults(), Map.of(), 1)
                .rounds().get(0);

        assertEquals(18.0, round.racePoints(), DELTA);
        assertEquals(8.0, round.sprintPoints(), DELTA);
        assertEquals(26.0, round.points(), DELTA);
        assertTrue(round.hasSprint());
        assertEquals(Integer.valueOf(1), round.sprintPosition());
    }

    @Test
    void aRoundWithoutASprintSaysSo() {
        List<ResultEntry> results = List.of(race(1, 1, 1, 1));

        RoundBreakdown round = calculator.driverBreakdown(results, RULES, ScoringOptions.defaults(), Map.of(), 1)
                .rounds().get(0);

        assertFalse(round.hasSprint());
        assertTrue(round.hasRace());
    }

    @Test
    void appliesTheShortenedRaceRule() {
        ScoringRules rules = new ScoringRules(Map.of(1, 25.0), Map.of(), 0.0, false, ShortenedPolicy.HALF_1980);
        List<ResultEntry> results = List.of(race(1, 1, 1, 1));
        Map<Long, RaceDistance> distances = Map.of(1L, new RaceDistance(77, 31, 31));

        DriverBreakdown breakdown = calculator.driverBreakdown(results, rules, ScoringOptions.defaults(), distances, 1);

        assertEquals(12.5, breakdown.rounds().get(0).racePoints(), DELTA);
    }

    @Test
    void anUnclassifiedResultHasNoPositionAndNoPoints() {
        List<ResultEntry> results = List.of(race(1, 1, 1, null), race(1, 1, 2, 1));

        RoundBreakdown round = calculator.driverBreakdown(results, RULES, ScoringOptions.defaults(), Map.of(), 1)
                .rounds().get(0);

        assertNull(round.racePosition());
        assertEquals(0.0, round.racePoints(), DELTA);
    }

    @Test
    void theBreakdownAgreesWithTheStandings() {
        List<ResultEntry> results = List.of(
                race(1, 1, 1, 1), race(1, 1, 2, 2), race(1, 1, 3, 3),
                race(2, 2, 3, 1), race(2, 2, 1, 2), race(2, 2, 2, 3));
        ScoringOptions options = new ScoringOptions(true, CountingRule.ALL, Set.of(), Set.of());

        List<StandingRow> standings = calculator.driverStandings(results, RULES, options);
        for (StandingRow row : standings) {
            DriverBreakdown breakdown = calculator.driverBreakdown(results, RULES, options, Map.of(), row.driverId());
            assertEquals(row.rank(), breakdown.rank());
            assertEquals(row.points(), breakdown.points(), DELTA);
        }
    }
}
