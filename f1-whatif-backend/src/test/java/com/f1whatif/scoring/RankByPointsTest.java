package com.f1whatif.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class RankByPointsTest {

    private final StandingsCalculator calculator = new StandingsCalculator();

    private static ResultEntry race(long raceId, int round, long driver, Integer position) {
        return new ResultEntry(raceId, round, driver, position, false, false);
    }

    @Test
    void ranksByTheGivenPoints() {
        List<StandingRow> rows = calculator.rankByPoints(List.of(), Map.of(1L, 10.0, 2L, 30.0, 3L, 20.0));

        assertEquals(List.of(2L, 3L, 1L), rows.stream().map(StandingRow::driverId).toList());
        assertEquals(1, rows.get(0).rank());
        assertEquals(30.0, rows.get(0).points(), 0.0001);
    }

    @Test
    void breaksTiesByCountbackLikeTheCalculation() {
        // Equal points: driver 5 has a better best finish, so ranks ahead although the id is higher.
        List<ResultEntry> results = List.of(race(1, 1, 4, 3), race(1, 1, 5, 2));

        List<StandingRow> rows = calculator.rankByPoints(results, Map.of(4L, 5.0, 5L, 5.0));

        assertEquals(List.of(5L, 4L), rows.stream().map(StandingRow::driverId).toList());
    }

    @Test
    void separatesDriversWithoutPointsByTheirBestFinishes() {
        // Nobody scored, but finishing 11th beats finishing 15th.
        List<ResultEntry> results = List.of(race(1, 1, 1, 15), race(1, 1, 2, 11), race(1, 1, 3, null));

        List<StandingRow> rows = calculator.rankByPoints(results, Map.of(1L, 0.0, 2L, 0.0, 3L, 0.0));

        assertEquals(List.of(2L, 1L, 3L), rows.stream().map(StandingRow::driverId).toList());
    }

    @Test
    void agreesWithTheCalculationWhenThePointsAreTheSame() {
        ScoringRules rules = new ScoringRules(Map.of(1, 25.0, 2, 18.0), Map.of(), 0.0, false);
        List<ResultEntry> results = List.of(
                race(1, 1, 1, 1), race(1, 1, 2, 2), race(1, 1, 3, 3), race(1, 1, 4, 4),
                race(2, 2, 2, 1), race(2, 2, 1, 2), race(2, 2, 4, 3), race(2, 2, 3, 4));

        List<StandingRow> calculated = calculator.driverStandings(results, rules, ScoringOptions.defaults());
        Map<Long, Double> points = Map.of(
                calculated.get(0).driverId(), calculated.get(0).points(),
                calculated.get(1).driverId(), calculated.get(1).points(),
                calculated.get(2).driverId(), calculated.get(2).points(),
                calculated.get(3).driverId(), calculated.get(3).points());

        List<StandingRow> ranked = calculator.rankByPoints(results, points);

        assertEquals(calculated.stream().map(StandingRow::driverId).toList(), ranked.stream().map(StandingRow::driverId).toList());
    }

    @Test
    void sprintsDoNotCountForTheCountback() {
        List<ResultEntry> results = List.of(
                new ResultEntry(1, 1, 1, 1, false, true),
                race(1, 1, 2, 1));

        List<StandingRow> rows = calculator.rankByPoints(results, Map.of(1L, 5.0, 2L, 5.0));

        // The sprint win of driver 1 is ignored, so the race win of driver 2 decides.
        assertEquals(List.of(2L, 1L), rows.stream().map(StandingRow::driverId).toList());
    }
}
