package com.f1whatif.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.f1whatif.dto.DriverProfile;
import com.f1whatif.dto.DriverRaceResult;
import com.f1whatif.dto.DriverScenarioRace;
import com.f1whatif.dto.DriverScenarioResponse;
import com.f1whatif.dto.DriverSeasonResponse;
import com.f1whatif.dto.DriverSeasonSummary;
import com.f1whatif.dto.ScenarioQuery;
import com.f1whatif.dto.SprintResultInfo;
import com.f1whatif.entity.Driver;
import com.f1whatif.entity.Race;
import com.f1whatif.entity.RaceResult;
import com.f1whatif.entity.ScoringRuleset;
import com.f1whatif.entity.SessionType;
import com.f1whatif.entity.Team;
import com.f1whatif.repository.RaceResultRepository;
import com.f1whatif.repository.ScoringRulesetRepository;
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
import org.springframework.web.server.ResponseStatusException;

class DriverScenarioServiceTest {

    private static final double DELTA = 0.0001;

    private final DriverSeasonService realResults = mock(DriverSeasonService.class);
    private final RaceResultRepository results = mock(RaceResultRepository.class);
    private final ScoringRulesetRepository rulesets = mock(ScoringRulesetRepository.class);
    private final ShortenedRaceRepository shortenedRaces = mock(ShortenedRaceRepository.class);
    private final DriverScenarioService service = new DriverScenarioService(realResults, results, rulesets, shortenedRaces);

    private final Team team = new Team("t", "Team", "X");
    private final List<Race> races = new ArrayList<>();
    private final List<RaceResult> rows = new ArrayList<>();

    private Driver driver(long id, String name) {
        Driver driver = new Driver("d" + id, name, "Driver", null, null, null);
        ReflectionTestUtils.setField(driver, "id", id);
        return driver;
    }

    private Race race(long id, int round) {
        Race race = new Race(null, round, null, "Race " + round, LocalDate.of(1984, 1, round), false);
        ReflectionTestUtils.setField(race, "id", id);
        races.add(race);
        return race;
    }

    private void result(Race race, Driver driver, SessionType session, Integer position) {
        rows.add(new RaceResult(race, driver, team, session, 1, position, position == null ? "R" : String.valueOf(position),
                "Finished", null, BigDecimal.ZERO));
    }

    private void givenRuleset() {
        ScoringRuleset ruleset = mock(ScoringRuleset.class);
        when(ruleset.getCode()).thenReturn("test");
        when(ruleset.getName()).thenReturn("Test points");
        when(ruleset.getRacePoints()).thenReturn(Map.of(1, new BigDecimal("25"), 2, new BigDecimal("18"), 3, new BigDecimal("15")));
        when(ruleset.getSprintPoints()).thenReturn(Map.of(1, new BigDecimal("8")));
        when(ruleset.getFastestLapPoint()).thenReturn(BigDecimal.ZERO);
        when(ruleset.getShortenedPolicy()).thenReturn(ShortenedPolicy.NONE);
        when(rulesets.findByCode("test")).thenReturn(Optional.of(ruleset));
        when(results.findByRace_Season_Year(1984)).thenReturn(rows);
        when(shortenedRaces.findBySeasonYear(1984)).thenReturn(List.of());
    }

    /** What really happened for driver 2: second in round 1, did not race round 2, third in round 3. */
    private void givenRealSeasonOfDriver2() {
        DriverProfile profile = new DriverProfile(2, "Driver Two", null, null, null, null);
        List<DriverRaceResult> real = List.of(
                new DriverRaceResult(1, "Race 1", null, false, true, "Team", 1, 2, "2", "Finished", new BigDecimal("18"),
                        new SprintResultInfo(1, 2, "2", new BigDecimal("7"))),
                new DriverRaceResult(2, "Race 2", null, false, false, null, null, null, null, null, null, null),
                new DriverRaceResult(3, "Race 3", null, false, true, "Team", 1, 3, "3", "Finished", new BigDecimal("15"), null));
        when(realResults.driverSeason(1984, 2)).thenReturn(
                new DriverSeasonResponse(profile, 1984, new DriverSeasonSummary(2, 0, 2, new BigDecimal("40")), real));
    }

    private ScenarioQuery query(boolean sprints, Integer countBest, Set<Long> drivers, Set<Integer> rounds) {
        return new ScenarioQuery("test", sprints, countBest, drivers, rounds);
    }

    @Test
    void givesTheScenarioPositionNextToTheRealOne() {
        givenRuleset();
        givenRealSeasonOfDriver2();
        Driver one = driver(1, "One");
        Driver two = driver(2, "Two");
        Driver three = driver(3, "Three");
        Race r1 = race(10, 1);
        Race r3 = race(30, 3);
        result(r1, one, SessionType.RACE, 1);
        result(r1, two, SessionType.RACE, 2);
        result(r1, three, SessionType.RACE, 3);
        result(r3, one, SessionType.RACE, 1);
        result(r3, three, SessionType.RACE, 2);
        result(r3, two, SessionType.RACE, 3);

        // Without driver 1, driver 2 moves up to first in round 1 and second in round 3.
        DriverScenarioResponse response = service.driverScenario(1984, 2, query(true, null, Set.of(1L), Set.of()));

        DriverScenarioRace first = response.races().get(0);
        assertEquals(Integer.valueOf(2), first.realFinishPosition());
        assertEquals(Integer.valueOf(1), first.finishPosition());
        assertEquals(25.0, first.points(), DELTA);
        DriverScenarioRace third = response.races().get(2);
        assertEquals(Integer.valueOf(3), third.realFinishPosition());
        assertEquals(Integer.valueOf(2), third.finishPosition());
        assertEquals(18.0, third.points(), DELTA);
        assertEquals(43.0, response.summary().points(), DELTA);
        assertEquals(1, response.summary().wins());
        assertEquals(2, response.summary().podiums());
        assertEquals("Test points", response.rulesetName());
    }

    @Test
    void marksARaceThatTheScenarioLeavesOut() {
        givenRuleset();
        givenRealSeasonOfDriver2();
        Driver one = driver(1, "One");
        Driver two = driver(2, "Two");
        Race r1 = race(10, 1);
        Race r3 = race(30, 3);
        result(r1, one, SessionType.RACE, 1);
        result(r1, two, SessionType.RACE, 2);
        result(r3, one, SessionType.RACE, 1);
        result(r3, two, SessionType.RACE, 3);

        DriverScenarioResponse response = service.driverScenario(1984, 2, query(true, null, Set.of(), Set.of(3)));

        DriverScenarioRace left = response.races().get(2);
        assertTrue(left.excluded());
        assertFalse(left.counted());
        assertNull(left.finishPosition());
        assertEquals(0.0, left.points(), DELTA);
        assertEquals(Integer.valueOf(3), left.realFinishPosition());
        assertEquals(18.0, response.summary().points(), DELTA);
    }

    @Test
    void keepsRacesTheDriverMissedAsTheyAre() {
        givenRuleset();
        givenRealSeasonOfDriver2();
        Driver two = driver(2, "Two");
        Race r1 = race(10, 1);
        result(r1, two, SessionType.RACE, 2);

        DriverScenarioRace missed = service.driverScenario(1984, 2, query(true, null, Set.of(), Set.of())).races().get(1);

        assertFalse(missed.entered());
        assertFalse(missed.excluded());
        assertNull(missed.finishPosition());
    }

    @Test
    void marksTheRoundsThatDoNotCountWhenOnlyTheBestResultsCount() {
        givenRuleset();
        givenRealSeasonOfDriver2();
        Driver two = driver(2, "Two");
        Race r1 = race(10, 1);
        Race r3 = race(30, 3);
        result(r1, two, SessionType.RACE, 1);
        result(r3, two, SessionType.RACE, 3);

        DriverScenarioResponse response = service.driverScenario(1984, 2, query(true, 1, Set.of(), Set.of()));

        assertTrue(response.races().get(0).counted());
        assertFalse(response.races().get(2).counted());
        assertEquals(25.0, response.summary().points(), DELTA);
        assertEquals(1, response.summary().racesCounted());
    }

    @Test
    void showsTheSprintOnlyWhenSprintsCount() {
        givenRuleset();
        givenRealSeasonOfDriver2();
        Driver two = driver(2, "Two");
        Race r1 = race(10, 1);
        result(r1, two, SessionType.RACE, 2);
        result(r1, two, SessionType.SPRINT, 1);

        DriverScenarioRace with = service.driverScenario(1984, 2, query(true, null, Set.of(), Set.of())).races().get(0);
        DriverScenarioRace without = service.driverScenario(1984, 2, query(false, null, Set.of(), Set.of())).races().get(0);

        assertEquals(Integer.valueOf(1), with.sprint().finishPosition());
        assertEquals(8.0, with.sprint().points(), DELTA);
        assertEquals(Integer.valueOf(2), with.sprint().realFinishPosition());
        assertNull(without.sprint());
    }

    @Test
    void anUnknownRulesetIsNotFound() {
        givenRealSeasonOfDriver2();
        when(rulesets.findByCode("test")).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.driverScenario(1984, 2, query(true, null, Set.of(), Set.of())));

        assertEquals(404, error.getStatusCode().value());
    }

    @Test
    void aDriverWhoIsExcludedHasNoPageInTheScenario() {
        givenRuleset();
        givenRealSeasonOfDriver2();

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.driverScenario(1984, 2, query(true, null, Set.of(2L), Set.of())));

        assertEquals(409, error.getStatusCode().value());
    }

    @Test
    void aSettingThatCannotBeRightIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> query(true, 0, Set.of(), Set.of()));
    }
}
