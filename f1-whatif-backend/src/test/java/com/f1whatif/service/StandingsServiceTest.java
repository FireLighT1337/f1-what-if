package com.f1whatif.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.f1whatif.entity.Driver;
import com.f1whatif.entity.Race;
import com.f1whatif.entity.RaceMultiplier;
import com.f1whatif.entity.RaceResult;
import com.f1whatif.entity.ScoringRuleset;
import com.f1whatif.entity.SeasonRule;
import com.f1whatif.entity.SessionType;
import com.f1whatif.entity.Team;
import com.f1whatif.repository.RaceMultiplierRepository;
import com.f1whatif.repository.RaceResultRepository;
import com.f1whatif.repository.ScoringRulesetRepository;
import com.f1whatif.repository.SeasonRuleRepository;
import com.f1whatif.repository.ShortenedRaceRepository;
import com.f1whatif.scoring.ShortenedPolicy;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class StandingsServiceTest {

    private static final double DELTA = 0.0001;

    private final RaceResultRepository results = mock(RaceResultRepository.class);
    private final ScoringRulesetRepository rulesets = mock(ScoringRulesetRepository.class);
    private final ShortenedRaceRepository shortenedRaces = mock(ShortenedRaceRepository.class);
    private final SeasonRuleRepository seasonRules = mock(SeasonRuleRepository.class);
    private final RaceMultiplierRepository raceMultipliers = mock(RaceMultiplierRepository.class);
    private final StandingsService service = new StandingsService(
            results, rulesets, shortenedRaces, seasonRules, raceMultipliers);

    private final Team team = new Team("t", "Team", "X");
    private final List<RaceResult> rows = new ArrayList<>();

    private Driver driver(long id) {
        Driver driver = new Driver("d" + id, "Driver " + id, "Name", null, null, null);
        ReflectionTestUtils.setField(driver, "id", id);
        return driver;
    }

    private Race race(long id, int round) {
        Race race = new Race(null, round, null, "Race " + round, LocalDate.of(1988, 1, round), false);
        ReflectionTestUtils.setField(race, "id", id);
        return race;
    }

    /** A race result whose actual points are given, so that the real ranking can differ from the what-if. */
    private void result(Race race, Driver driver, int position, String actualPoints) {
        rows.add(new RaceResult(race, driver, team, SessionType.RACE, 1, position, String.valueOf(position),
                "Finished", null, new BigDecimal(actualPoints)));
    }

    private void givenSeason() {
        ScoringRuleset ruleset = mock(ScoringRuleset.class);
        when(ruleset.getCode()).thenReturn("test");
        when(ruleset.getRacePoints()).thenReturn(Map.of(1, new BigDecimal("9"), 2, new BigDecimal("6")));
        when(ruleset.getSprintPoints()).thenReturn(Map.of());
        when(ruleset.getFastestLapPoint()).thenReturn(BigDecimal.ZERO);
        when(ruleset.getShortenedPolicy()).thenReturn(ShortenedPolicy.NONE);
        when(rulesets.findByCode("test")).thenReturn(Optional.of(ruleset));
        when(results.findByRace_Season_Year(1988)).thenReturn(rows);
        when(shortenedRaces.findBySeasonYear(1988)).thenReturn(List.of());
    }

    private StandingsQuery query(Integer countBest) {
        return new StandingsQuery(countBest, true, Set.of(), Set.of());
    }

    /** Driver 1 wins rounds 1-2, driver 2 wins round 3 and is second otherwise. */
    private void givenThreeRounds() {
        Driver one = driver(1);
        Driver two = driver(2);
        Race r1 = race(10, 1);
        Race r2 = race(20, 2);
        Race r3 = race(30, 3);
        result(r1, one, 1, "9");
        result(r1, two, 2, "6");
        result(r2, one, 1, "9");
        result(r2, two, 2, "6");
        result(r3, two, 1, "9");
        result(r3, one, 2, "6");
    }

    @Test
    void realRanksFollowTheSeasonRuleWhateverTheUserChooses() {
        givenSeason();
        Driver one = driver(1);
        Driver two = driver(2);
        // Driver 1 scores 9, 9, 0, 0 and driver 2 scores 6, 6, 9, 6.
        result(race(10, 1), one, 1, "9");
        result(race(10, 1), two, 2, "6");
        result(race(20, 2), one, 1, "9");
        result(race(20, 2), two, 2, "6");
        result(race(30, 3), two, 1, "9");
        result(race(30, 3), one, 3, "0");
        result(race(40, 4), two, 2, "6");
        result(race(40, 4), one, 3, "0");
        // Season rule: only the best 2 round totals counted, so really driver 1 (18) beat driver 2 (15).
        when(seasonRules.findById(1988)).thenReturn(Optional.of(new SeasonRule(1988, null, null, null, 2)));

        // All results count in the what-if: driver 2 has 27 and driver 1 has 18, so they swap places.
        StandingsResponse allResults = service.standings(1988, "test", query(0));
        assertEquals(2L, allResults.standings().get(0).driverId());
        assertEquals(Integer.valueOf(2), allResults.standings().get(0).actualRank());
        assertEquals(Integer.valueOf(1), allResults.standings().get(0).positionChange());
        assertEquals(Integer.valueOf(-1), allResults.standings().get(1).positionChange());

        // With the season rule as the default the what-if matches reality: nobody moves.
        StandingsResponse seasonRule = service.standings(1988, "test", query(null));
        assertEquals(1L, seasonRule.standings().get(0).driverId());
        assertEquals(18.0, seasonRule.standings().get(0).points(), DELTA);
        assertEquals(15.0, seasonRule.standings().get(1).points(), DELTA);
        assertEquals(Integer.valueOf(0), seasonRule.standings().get(0).positionChange());
        assertEquals(Integer.valueOf(0), seasonRule.standings().get(1).positionChange());
    }

    @Test
    void doublePointsOfAMultiplierRoundApplyToTheWhatIf() {
        givenSeason();
        givenThreeRounds();
        when(raceMultipliers.findBySeasonYear(1988)).thenReturn(
                List.of(new RaceMultiplier(1988, 3, new BigDecimal("2.00"), "double")));

        StandingsResponse response = service.standings(1988, "test", query(0));

        // Driver 1: 9 + 9 + 12 = 30, driver 2: 6 + 6 + 18 = 30. Equal points: driver 1 has more wins.
        assertEquals(30.0, response.standings().get(0).points(), DELTA);
        assertEquals(30.0, response.standings().get(1).points(), DELTA);
        assertEquals(1L, response.standings().get(0).driverId());
    }

    @Test
    void anUnknownRulesetIsNotFound() {
        when(rulesets.findByCode("nope")).thenReturn(Optional.empty());

        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> service.standings(1988, "nope", query(null)));
    }

    @Test
    void aNegativeCountBestIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> new StandingsQuery(-1, true, Set.of(), Set.of()));
    }
}
