package com.f1whatif.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.f1whatif.dto.RaceInfo;
import com.f1whatif.dto.SeasonDriver;
import com.f1whatif.dto.SeasonDriverRow;
import com.f1whatif.entity.Circuit;
import com.f1whatif.entity.Race;
import com.f1whatif.entity.ShortenedRace;
import com.f1whatif.repository.ReferenceQueryRepository;
import com.f1whatif.repository.ScoringRulesetRepository;
import com.f1whatif.repository.ShortenedRaceRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class ReferenceDataServiceTest {

    private final ReferenceQueryRepository reference = mock(ReferenceQueryRepository.class);
    private final ShortenedRaceRepository shortenedRaces = mock(ShortenedRaceRepository.class);
    private final ScoringRulesetRepository rulesets = mock(ScoringRulesetRepository.class);
    private final ReferenceDataService service = new ReferenceDataService(reference, shortenedRaces, rulesets);

    private static Race race(int round, String name) {
        Circuit circuit = new Circuit("circuit-" + round, "Circuit " + round, "Town " + round, "Country");
        return new Race(null, round, circuit, name, LocalDate.of(1984, 1, round), false);
    }

    @Test
    void racesMarkTheShortenedOnesAndKeepTheirNote() {
        when(reference.findRacesWithCircuit(1984)).thenReturn(List.of(race(5, "French Grand Prix"), race(6, "Monaco Grand Prix")));
        when(shortenedRaces.findBySeasonYear(1984))
                .thenReturn(List.of(new ShortenedRace(1984, 6, 77, 31, 31, "Monaco GP: half points")));

        List<RaceInfo> races = service.races(1984);

        assertEquals(2, races.size());
        assertEquals(false, races.get(0).shortened());
        assertNull(races.get(0).shortenedNote());
        assertEquals(true, races.get(1).shortened());
        assertEquals("Monaco GP: half points", races.get(1).shortenedNote());
        assertEquals("Circuit 6", races.get(1).circuit());
    }

    @Test
    void racesOfASeasonWithoutDataAreNotFound() {
        when(reference.findRacesWithCircuit(1900)).thenReturn(List.of());

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.races(1900));

        assertEquals(404, error.getStatusCode().value());
    }

    @Test
    void driversAreGroupedWithAllTheirTeamsInOrder() {
        when(reference.findSeasonDriverRows(1984)).thenReturn(List.of(
                new SeasonDriverRow(1L, "LAU", "Niki", "Lauda", "Austrian", "McLaren"),
                new SeasonDriverRow(2L, "PRO", "Alain", "Prost", "French", "McLaren"),
                new SeasonDriverRow(3L, "SEN", "Ayrton", "Senna", "Brazilian", "Toleman"),
                new SeasonDriverRow(3L, "SEN", "Ayrton", "Senna", "Brazilian", "Lotus")));

        List<SeasonDriver> drivers = service.drivers(1984);

        assertEquals(3, drivers.size());
        assertEquals("Niki Lauda", drivers.get(0).name());
        assertEquals(List.of("McLaren"), drivers.get(0).teams());
        assertEquals(3L, drivers.get(2).id());
        assertEquals(List.of("Toleman", "Lotus"), drivers.get(2).teams());
    }

    @Test
    void driversOfASeasonWithoutDataAreNotFound() {
        when(reference.findSeasonDriverRows(1900)).thenReturn(List.of());

        assertThrows(ResponseStatusException.class, () -> service.drivers(1900));
    }

    @Test
    void anUnknownRulesetIsNotFound() {
        when(rulesets.findByCode("nope")).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.ruleset("nope"));

        assertEquals(404, error.getStatusCode().value());
        assertTrue(error.getReason().contains("nope"));
    }
}
