package com.f1whatif.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.f1whatif.dto.ScenarioRequest;
import com.f1whatif.entity.AppUser;
import com.f1whatif.entity.Race;
import com.f1whatif.entity.Role;
import com.f1whatif.entity.Scenario;
import com.f1whatif.entity.ScoringRuleset;
import com.f1whatif.repository.AppUserRepository;
import com.f1whatif.repository.DriverRepository;
import com.f1whatif.repository.RaceQueryRepository;
import com.f1whatif.repository.ScenarioRepository;
import com.f1whatif.repository.ScoringRulesetRepository;
import com.f1whatif.repository.SeasonRepository;
import com.f1whatif.scoring.ScoringOptions;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

class ScenarioServiceTest {

    private final ScenarioRepository scenarios = mock(ScenarioRepository.class);
    private final AppUserRepository users = mock(AppUserRepository.class);
    private final ScoringRulesetRepository rulesets = mock(ScoringRulesetRepository.class);
    private final SeasonRepository seasons = mock(SeasonRepository.class);
    private final DriverRepository drivers = mock(DriverRepository.class);
    private final RaceQueryRepository races = mock(RaceQueryRepository.class);
    private final StandingsService standingsService = mock(StandingsService.class);

    private final ScenarioService service = new ScenarioService(scenarios, users, rulesets, seasons, drivers, races,
            standingsService);

    private static ScenarioRequest request(String rulesetCode, int seasonYear) {
        return new ScenarioRequest("My scenario", seasonYear, rulesetCode, true, null, Set.of(), Set.of());
    }

    private static Race race(long id, int round) {
        Race race = new Race(null, round, null, "Race " + round, LocalDate.of(1984, 1, 1), false);
        ReflectionTestUtils.setField(race, "id", id);
        return race;
    }

    @Test
    void anotherUsersScenarioLooksLikeItDoesNotExist() {
        when(scenarios.findByIdAndOwner_Id(5L, 2L)).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.get(2L, 5L));

        assertEquals(404, error.getStatusCode().value());
    }

    @Test
    void createRejectsAnUnknownRuleset() {
        when(rulesets.findByCode("nope")).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.create(1L, request("nope", 1984)));

        assertEquals(400, error.getStatusCode().value());
    }

    @Test
    void createRejectsASeasonWithoutData() {
        when(rulesets.findByCode("classic-1961")).thenReturn(Optional.of(mock(ScoringRuleset.class)));
        when(seasons.existsById(1900)).thenReturn(false);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.create(1L, request("classic-1961", 1900)));

        assertEquals(400, error.getStatusCode().value());
    }

    @Test
    void createRejectsMoreScenariosThanTheLimit() {
        when(rulesets.findByCode("classic-1961")).thenReturn(Optional.of(mock(ScoringRuleset.class)));
        when(seasons.existsById(1984)).thenReturn(true);
        when(scenarios.countByOwner_Id(1L)).thenReturn((long) ScenarioService.MAX_SCENARIOS_PER_USER);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.create(1L, request("classic-1961", 1984)));

        assertEquals(409, error.getStatusCode().value());
    }

    @Test
    void standingsTurnExcludedRoundsIntoRaceIds() {
        AppUser owner = new AppUser("asad@example.com", "hash", Role.USER);
        Scenario scenario = new Scenario(owner, "No Monaco", 1984, "classic-1961", true, 11,
                Set.of(5L), Set.of(6));
        when(scenarios.findByIdAndOwner_Id(1L, 1L)).thenReturn(Optional.of(scenario));
        when(races.findBySeason_Year(1984)).thenReturn(List.of(race(50, 5), race(60, 6), race(70, 7)));

        service.standings(1L, 1L);

        ArgumentCaptor<ScoringOptions> options = ArgumentCaptor.forClass(ScoringOptions.class);
        verify(standingsService).standings(eq(1984), eq("classic-1961"), options.capture());
        assertEquals(Set.of(60L), options.getValue().excludedRaceIds());
        assertEquals(Set.of(5L), options.getValue().excludedDriverIds());
        assertEquals(Integer.valueOf(11), options.getValue().countBest());
    }

    @Test
    void sharingTwiceKeepsTheSameLinkAndUnsharingRemovesIt() {
        AppUser owner = new AppUser("asad@example.com", "hash", Role.USER);
        Scenario scenario = new Scenario(owner, "S", 1984, "classic-1961", true, null, Set.of(), Set.of());

        scenario.share();
        String first = scenario.getPublicId();
        scenario.share();

        assertEquals(first, scenario.getPublicId());
        scenario.unshare();
        assertNull(scenario.getPublicId());
    }
}
