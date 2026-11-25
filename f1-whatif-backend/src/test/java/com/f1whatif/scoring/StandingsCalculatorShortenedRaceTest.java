package com.f1whatif.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class StandingsCalculatorShortenedRaceTest {

    private static final double DELTA = 0.0001;
    private static final long PROST_LIKE = 1;
    private static final long LAUDA_LIKE = 2;

    private static final Map<Integer, Double> OLD_TABLE =
            Map.of(1, 9.0, 2, 6.0, 3, 4.0, 4, 3.0, 5, 2.0, 6, 1.0);
    private static final ScoringRules OLD_HALF_RULES =
            new ScoringRules(OLD_TABLE, Map.of(), 0.0, false, ShortenedPolicy.HALF_1980);

    private static final Map<Integer, Double> MODERN_TABLE =
            Map.of(1, 25.0, 2, 18.0, 3, 15.0, 4, 12.0, 5, 10.0);

    private final StandingsCalculator calculator = new StandingsCalculator();

    private static ResultEntry race(long raceId, int round, long driver, Integer position) {
        return new ResultEntry(raceId, round, driver, position, false, false);
    }

    /**
     * The pattern of the 1984 title: the driver who won the shortened race scored half of the
     * usual points, and the rival finished half a point ahead because of it.
     */
    private static List<ResultEntry> halfPointTitleSeason() {
        return List.of(
                race(1, 1, LAUDA_LIKE, 1), race(1, 1, PROST_LIKE, 3),
                race(2, 2, PROST_LIKE, 1), race(2, 2, LAUDA_LIKE, null));
    }

    @Test
    void halfPointsRaceCanDecideTheChampionshipByHalfAPoint() {
        Map<Long, RaceDistance> distances = Map.of(2L, new RaceDistance(77, 31, 31));

        List<StandingRow> standings = calculator.driverStandings(
                halfPointTitleSeason(), OLD_HALF_RULES, ScoringOptions.defaults(), distances);

        assertEquals(LAUDA_LIKE, standings.get(0).driverId());
        assertEquals(9.0, standings.get(0).points(), DELTA);
        assertEquals(PROST_LIKE, standings.get(1).driverId());
        assertEquals(8.5, standings.get(1).points(), DELTA);
    }

    @Test
    void sameSeasonWithoutTheShortenedRaceDataGivesTheOtherDriverTheTitle() {
        List<StandingRow> standings = calculator.driverStandings(
                halfPointTitleSeason(), OLD_HALF_RULES, ScoringOptions.defaults());

        assertEquals(PROST_LIKE, standings.get(0).driverId());
        assertEquals(13.0, standings.get(0).points(), DELTA);
    }

    @Test
    void racesNotListedAsShortenedAreScoredInFull() {
        Map<Long, RaceDistance> distances = Map.of(99L, new RaceDistance(77, 31, 31));

        List<StandingRow> standings = calculator.driverStandings(
                halfPointTitleSeason(), OLD_HALF_RULES, ScoringOptions.defaults(), distances);

        assertEquals(13.0, standings.get(0).points(), DELTA);
    }

    @Test
    void fastestLapPointIsNotAwardedInAHalfPointsRace() {
        ScoringRules rules = new ScoringRules(MODERN_TABLE, Map.of(), 1.0, true, ShortenedPolicy.HALF_1980);
        List<ResultEntry> results = List.of(new ResultEntry(1, 1, 1, 1, true, false));
        Map<Long, RaceDistance> distances = Map.of(1L, new RaceDistance(44, 20, 20));

        List<StandingRow> shortened = calculator.driverStandings(results, rules, ScoringOptions.defaults(), distances);
        List<StandingRow> full = calculator.driverStandings(results, rules, ScoringOptions.defaults());

        assertEquals(12.5, shortened.get(0).points(), DELTA);
        assertEquals(26.0, full.get(0).points(), DELTA);
    }

    @Test
    void tieredPolicyReplacesThePointsTableForAShortenedRace() {
        ScoringRules rules = new ScoringRules(MODERN_TABLE, Map.of(), 1.0, true, ShortenedPolicy.TIERED_2022);
        List<ResultEntry> results = List.of(
                new ResultEntry(1, 1, 1, 1, false, false),
                new ResultEntry(1, 1, 2, 2, true, false),
                new ResultEntry(1, 1, 3, 3, false, false));
        // 40% of the distance: the 25%-50% table (13, 10, 8 ...), no fastest-lap point.
        Map<Long, RaceDistance> distances = Map.of(1L, new RaceDistance(50, 20, 20));

        List<StandingRow> standings = calculator.driverStandings(
                results, rules, ScoringOptions.defaults(), distances);

        assertEquals(13.0, standings.get(0).points(), DELTA);
        assertEquals(10.0, standings.get(1).points(), DELTA);
        assertEquals(8.0, standings.get(2).points(), DELTA);
    }

    @Test
    void belgium2021PatternPaysHalfUnderOldRulesAndNothingUnderTheTieredRules() {
        List<ResultEntry> results = List.of(race(1, 1, 1, 1));
        Map<Long, RaceDistance> distances = Map.of(1L, new RaceDistance(44, 2, 0));
        ScoringRules oldRules = new ScoringRules(MODERN_TABLE, Map.of(), 0.0, false, ShortenedPolicy.HALF_1980);
        ScoringRules newRules = new ScoringRules(MODERN_TABLE, Map.of(), 0.0, false, ShortenedPolicy.TIERED_2022);

        assertEquals(12.5, calculator.driverStandings(results, oldRules, ScoringOptions.defaults(), distances)
                .get(0).points(), DELTA);
        assertEquals(0.0, calculator.driverStandings(results, newRules, ScoringOptions.defaults(), distances)
                .get(0).points(), DELTA);
    }

    @Test
    void sprintPointsAreNotAffectedByTheRaceDistance() {
        ScoringRules rules = new ScoringRules(MODERN_TABLE, Map.of(1, 8.0), 0.0, false, ShortenedPolicy.HALF_1980);
        List<ResultEntry> results = List.of(
                new ResultEntry(1, 1, 1, 1, false, false),
                new ResultEntry(1, 1, 1, 1, false, true));
        Map<Long, RaceDistance> distances = Map.of(1L, new RaceDistance(44, 20, 20));

        List<StandingRow> standings = calculator.driverStandings(
                results, rules, ScoringOptions.defaults(), distances);

        assertEquals(20.5, standings.get(0).points(), DELTA);
    }

    @Test
    void excludingADriverStillAppliesTheShortenedRaceRule() {
        List<ResultEntry> results = List.of(race(1, 1, 1, 1), race(1, 1, 2, 2));
        Map<Long, RaceDistance> distances = Map.of(1L, new RaceDistance(44, 20, 20));
        ScoringOptions options = new ScoringOptions(true, CountingRule.ALL, Set.of(1L), Set.of());
        ScoringRules rules = new ScoringRules(MODERN_TABLE, Map.of(), 0.0, false, ShortenedPolicy.HALF_1980);

        List<StandingRow> standings = calculator.driverStandings(results, rules, options, distances);

        assertEquals(1, standings.size());
        assertEquals(12.5, standings.get(0).points(), DELTA);
    }
}
