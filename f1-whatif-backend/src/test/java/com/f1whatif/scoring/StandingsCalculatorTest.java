package com.f1whatif.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class StandingsCalculatorTest {

    private static final double DELTA = 0.0001;

    private static final ScoringRules SIMPLE = new ScoringRules(
            Map.of(1, 25.0, 2, 18.0, 3, 15.0),
            Map.of(1, 8.0, 2, 7.0),
            0.0,
            false);

    private final StandingsCalculator calculator = new StandingsCalculator();

    private static ResultEntry race(long raceId, int round, long driver, Integer position) {
        return new ResultEntry(raceId, round, driver, position, false, false);
    }

    private static ResultEntry sprint(long raceId, int round, long driver, Integer position) {
        return new ResultEntry(raceId, round, driver, position, false, true);
    }

    @Test
    void awardsPointsByFinishingPositionAndOrdersByTotal() {
        List<ResultEntry> results = List.of(
                race(1, 1, 1, 1), race(1, 1, 2, 2), race(1, 1, 3, 3),
                race(2, 2, 2, 1), race(2, 2, 3, 2), race(2, 2, 1, 3));

        List<StandingRow> standings = calculator.driverStandings(results, SIMPLE, ScoringOptions.defaults());

        assertEquals(List.of(2L, 1L, 3L), standings.stream().map(StandingRow::driverId).toList());
        assertEquals(43.0, standings.get(0).points(), DELTA);
        assertEquals(40.0, standings.get(1).points(), DELTA);
        assertEquals(33.0, standings.get(2).points(), DELTA);
        assertEquals(1, standings.get(0).rank());
    }

    @Test
    void fastestLapPointRequiresTopTenWhenConfigured() {
        ScoringRules rules = new ScoringRules(Map.of(1, 25.0), Map.of(), 1.0, true);
        List<ResultEntry> results = List.of(
                new ResultEntry(1, 1, 1, 1, true, false),
                new ResultEntry(1, 1, 2, 11, true, false));

        List<StandingRow> standings = calculator.driverStandings(results, rules, ScoringOptions.defaults());

        assertEquals(26.0, standings.get(0).points(), DELTA);
        assertEquals(0.0, standings.get(1).points(), DELTA);
    }

    @Test
    void countBestKeepsOnlyTheBestRoundTotals() {
        List<ResultEntry> results = List.of(
                race(1, 1, 1, 1), race(2, 2, 1, 3), race(3, 3, 1, 1));
        ScoringOptions options = new ScoringOptions(true, 2, Set.of(), Set.of());

        List<StandingRow> standings = calculator.driverStandings(results, SIMPLE, options);

        assertEquals(50.0, standings.get(0).points(), DELTA);
    }

    @Test
    void excludingADriverMovesEveryoneBehindThemUp() {
        List<ResultEntry> results = List.of(race(1, 1, 1, 1), race(1, 1, 2, 2), race(1, 1, 3, 3));
        ScoringOptions options = new ScoringOptions(true, null, Set.of(1L), Set.of());

        List<StandingRow> standings = calculator.driverStandings(results, SIMPLE, options);

        assertEquals(2, standings.size());
        assertEquals(2L, standings.get(0).driverId());
        assertEquals(25.0, standings.get(0).points(), DELTA);
        assertEquals(18.0, standings.get(1).points(), DELTA);
    }

    @Test
    void sprintPointsCountOnlyWhenSprintsAreIncluded() {
        List<ResultEntry> results = List.of(race(1, 1, 1, 1), sprint(1, 1, 1, 1));

        double withSprints = calculator.driverStandings(results, SIMPLE, ScoringOptions.defaults())
                .get(0).points();
        double withoutSprints = calculator.driverStandings(
                        results, SIMPLE, new ScoringOptions(false, null, Set.of(), Set.of()))
                .get(0).points();

        assertEquals(33.0, withSprints, DELTA);
        assertEquals(25.0, withoutSprints, DELTA);
    }

    @Test
    void equalPointsAreSeparatedByCountback() {
        ScoringRules rules = new ScoringRules(Map.of(1, 10.0, 2, 6.0, 4, 2.0), Map.of(), 0.0, false);
        // Driver 2 wins once and finishes 4th once (12 points); driver 1 is 2nd twice (12 points).
        List<ResultEntry> results = List.of(
                race(1, 1, 2, 1), race(1, 1, 1, 2),
                race(2, 2, 2, 4), race(2, 2, 1, 2));

        List<StandingRow> standings = calculator.driverStandings(results, rules, ScoringOptions.defaults());

        assertEquals(standings.get(0).points(), standings.get(1).points(), DELTA);
        assertEquals(2L, standings.get(0).driverId());
        assertTrue(standings.get(0).rank() < standings.get(1).rank());
    }
}
