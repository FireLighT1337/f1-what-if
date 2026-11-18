package com.f1whatif.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.f1whatif.dto.DriverRaceResult;
import com.f1whatif.dto.DriverSeasonResponse;
import com.f1whatif.entity.Circuit;
import com.f1whatif.entity.Driver;
import com.f1whatif.entity.Race;
import com.f1whatif.entity.RaceResult;
import com.f1whatif.entity.SessionType;
import com.f1whatif.entity.ShortenedRace;
import com.f1whatif.entity.Team;
import com.f1whatif.repository.DriverRepository;
import com.f1whatif.repository.DriverResultQueryRepository;
import com.f1whatif.repository.ReferenceQueryRepository;
import com.f1whatif.repository.ShortenedRaceRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

class DriverSeasonServiceTest {

    private final DriverRepository drivers = mock(DriverRepository.class);
    private final DriverResultQueryRepository driverResults = mock(DriverResultQueryRepository.class);
    private final ReferenceQueryRepository reference = mock(ReferenceQueryRepository.class);
    private final ShortenedRaceRepository shortenedRaces = mock(ShortenedRaceRepository.class);
    private final DriverSeasonService service = new DriverSeasonService(drivers, driverResults, reference, shortenedRaces);

    private final Driver prost = new Driver("prost", "Alain", "Prost", "PRO", "French", LocalDate.of(1955, 2, 24));
    private final Team mclaren = new Team("mclaren", "McLaren", "British");
    private final Circuit circuit = new Circuit("c", "Circuit", "Town", "Country");

    private Race race(int round, String name) {
        return new Race(null, round, circuit, name, LocalDate.of(1984, 1, round), false);
    }

    private RaceResult result(Race race, SessionType session, Integer grid, Integer finish, String text, String status, String points) {
        return new RaceResult(race, prost, mclaren, session, grid, finish, text, status, null, new BigDecimal(points));
    }

    private void givenDriver() {
        ReflectionTestUtils.setField(prost, "id", 2L);
        ReflectionTestUtils.setField(prost, "wikipediaUrl", "http://en.wikipedia.org/wiki/Alain_Prost");
        when(drivers.findById(2L)).thenReturn(Optional.of(prost));
    }

    @Test
    void listsEveryRaceOfTheSeasonIncludingOnesTheDriverMissed() {
        givenDriver();
        Race r1 = race(1, "Brazilian Grand Prix");
        Race r2 = race(2, "South African Grand Prix");
        Race r3 = race(3, "Belgian Grand Prix");
        when(reference.findRacesWithCircuit(1984)).thenReturn(List.of(r1, r2, r3));
        when(driverResults.findDriverSeasonResults(1984, 2L)).thenReturn(List.of(
                result(r1, SessionType.RACE, 2, 1, "1", "Finished", "9"),
                result(r3, SessionType.RACE, 1, null, "R", "Engine", "0")));
        when(shortenedRaces.findBySeasonYear(1984)).thenReturn(List.of());

        DriverSeasonResponse response = service.driverSeason(1984, 2L);

        assertEquals(3, response.races().size());
        DriverRaceResult missed = response.races().get(1);
        assertFalse(missed.entered());
        assertNull(missed.finishPosition());
        assertEquals("Brazilian Grand Prix", response.races().get(0).raceName());
        assertEquals("R", response.races().get(2).positionText());
        assertNull(response.races().get(2).finishPosition());
        assertEquals("Engine", response.races().get(2).status());
    }

    @Test
    void summarisesStartsWinsPodiumsAndRealPointsIncludingSprints() {
        givenDriver();
        Race r1 = race(1, "A");
        Race r2 = race(2, "B");
        Race r3 = race(3, "C");
        when(reference.findRacesWithCircuit(1984)).thenReturn(List.of(r1, r2, r3));
        when(driverResults.findDriverSeasonResults(1984, 2L)).thenReturn(List.of(
                result(r1, SessionType.RACE, 1, 1, "1", "Finished", "25"),
                result(r1, SessionType.SPRINT, 2, 3, "3", "Finished", "6"),
                result(r2, SessionType.RACE, 4, 3, "3", "Finished", "15"),
                result(r3, SessionType.RACE, 5, 8, "8", "Finished", "4")));
        when(shortenedRaces.findBySeasonYear(1984)).thenReturn(List.of());

        DriverSeasonResponse response = service.driverSeason(1984, 2L);

        assertEquals(3, response.summary().racesEntered());
        assertEquals(1, response.summary().wins());
        assertEquals(2, response.summary().podiums());
        assertEquals(0, new BigDecimal("50").compareTo(response.summary().points()));
        assertEquals(Integer.valueOf(3), response.races().get(0).sprint().finishPosition());
    }

    @Test
    void marksRacesThatEndedEarly() {
        givenDriver();
        Race monaco = race(6, "Monaco Grand Prix");
        when(reference.findRacesWithCircuit(1984)).thenReturn(List.of(monaco));
        when(driverResults.findDriverSeasonResults(1984, 2L)).thenReturn(List.of(
                result(monaco, SessionType.RACE, 1, 1, "1", "Finished", "4.5")));
        when(shortenedRaces.findBySeasonYear(1984)).thenReturn(List.of(new ShortenedRace(1984, 6, 77, 31, 31, "half points")));

        assertTrue(service.driverSeason(1984, 2L).races().get(0).shortened());
    }

    @Test
    void givesTheDriverProfileWithAnHttpsWikipediaLink() {
        givenDriver();
        Race r1 = race(1, "A");
        when(reference.findRacesWithCircuit(1984)).thenReturn(List.of(r1));
        when(driverResults.findDriverSeasonResults(1984, 2L)).thenReturn(List.of(
                result(r1, SessionType.RACE, 1, 1, "1", "Finished", "9")));
        when(shortenedRaces.findBySeasonYear(1984)).thenReturn(List.of());

        var profile = service.driverSeason(1984, 2L).driver();

        assertEquals("Alain Prost", profile.name());
        assertEquals("https://en.wikipedia.org/wiki/Alain_Prost", profile.wikipediaUrl());
    }

    @Test
    void aDriverWhoDidNotRaceInTheSeasonIsNotFound() {
        givenDriver();
        when(driverResults.findDriverSeasonResults(1900, 2L)).thenReturn(List.of());

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.driverSeason(1900, 2L));

        assertEquals(404, error.getStatusCode().value());
    }

    @Test
    void anUnknownDriverIsNotFound() {
        when(drivers.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.driverSeason(1984, 99L));

        assertEquals(404, error.getStatusCode().value());
    }
}
