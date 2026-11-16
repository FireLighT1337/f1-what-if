package com.f1whatif.importer;

import com.f1whatif.entity.Circuit;
import com.f1whatif.entity.Driver;
import com.f1whatif.entity.Race;
import com.f1whatif.entity.RaceResult;
import com.f1whatif.entity.Season;
import com.f1whatif.entity.SessionType;
import com.f1whatif.entity.Team;
import com.f1whatif.importer.JolpicaResponse.CircuitDto;
import com.f1whatif.importer.JolpicaResponse.DriverDto;
import com.f1whatif.importer.JolpicaResponse.RaceDto;
import com.f1whatif.importer.JolpicaResponse.ResultDto;
import com.f1whatif.repository.CircuitRepository;
import com.f1whatif.repository.DriverRepository;
import com.f1whatif.repository.RaceRepository;
import com.f1whatif.repository.RaceResultRepository;
import com.f1whatif.repository.SeasonRepository;
import com.f1whatif.repository.TeamRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Stores one season in the database. The season's races and results are deleted
 * and
 * written again, so running the import twice gives the same data. Circuits,
 * drivers and
 * teams are matched by their external id and only created when missing.
 */
@Service
@Profile("import")
public class SeasonImporter {

    private static final Logger log = LoggerFactory.getLogger(SeasonImporter.class);

    @PersistenceContext
    private EntityManager entityManager;

    private final SeasonRepository seasons;
    private final CircuitRepository circuits;
    private final DriverRepository drivers;
    private final TeamRepository teams;
    private final RaceRepository races;
    private final RaceResultRepository results;

    public SeasonImporter(SeasonRepository seasons, CircuitRepository circuits, DriverRepository drivers,
            TeamRepository teams, RaceRepository races, RaceResultRepository results) {
        this.seasons = seasons;
        this.circuits = circuits;
        this.drivers = drivers;
        this.teams = teams;
        this.races = races;
        this.results = results;
    }

    /** @return the number of results stored (races and sprints together) */
    @Transactional
    public int importSeason(int year, List<RaceDto> raceRows, List<RaceDto> sprintRows) {
        deleteExisting(year);

        Season season = seasons.findById(year).orElseGet(() -> seasons.save(new Season(year)));

        Set<String> sprintRounds = new HashSet<>();
        for (RaceDto sprint : sprintRows) {
            if (!sprint.sprintResultsOrEmpty().isEmpty()) {
                sprintRounds.add(sprint.round());
            }
        }

        Map<String, Circuit> circuitCache = new HashMap<>();
        Map<String, Driver> driverCache = new HashMap<>();
        Map<String, Team> teamCache = new HashMap<>();
        Map<String, Race> raceByRound = new HashMap<>();
        // One entry per race, driver and session; duplicates are resolved while
        // collecting.
        Map<String, RaceResult> unique = new LinkedHashMap<>();

        for (RaceDto dto : raceRows) {
            Circuit circuit = circuitCache.computeIfAbsent(
                    dto.circuit().circuitId(), id -> findOrCreateCircuit(dto.circuit()));
            Race race = races.save(new Race(
                    season,
                    Integer.parseInt(dto.round()),
                    circuit,
                    dto.raceName(),
                    ImportMapping.parseDate(dto.date()),
                    sprintRounds.contains(dto.round())));
            raceByRound.put(dto.round(), race);
            collect(unique, race, SessionType.RACE, dto.resultsOrEmpty(), driverCache, teamCache);
        }

        for (RaceDto dto : sprintRows) {
            Race race = raceByRound.get(dto.round());
            if (race == null) {
                log.warn("Sprint for round {} of {} has no matching race, skipped", dto.round(), year);
                continue;
            }
            collect(unique, race, SessionType.SPRINT, dto.sprintResultsOrEmpty(), driverCache, teamCache);
        }

        results.saveAll(unique.values());
        return unique.size();
    }

    private void deleteExisting(int year) {
        entityManager.createQuery(
                "delete from RaceResult r where r.race in "
                        + "(select ra from Race ra where ra.season.year = :year)")
                .setParameter("year", year)
                .executeUpdate();
        entityManager.createQuery("delete from Race ra where ra.season.year = :year")
                .setParameter("year", year)
                .executeUpdate();
    }

    private void collect(Map<String, RaceResult> unique, Race race, SessionType session, List<ResultDto> rows,
            Map<String, Driver> driverCache, Map<String, Team> teamCache) {
        for (ResultDto row : rows) {
            Driver driver = driverCache.computeIfAbsent(row.driver().driverId(),
                    id -> findOrCreateDriver(row.driver()));
            Team team = teamCache.computeIfAbsent(row.constructor().constructorId(), id -> findOrCreateTeam(row));

            Integer fastestLapRank = row.fastestLap() == null ? null : ImportMapping.parseInt(row.fastestLap().rank());
            RaceResult candidate = new RaceResult(
                    race,
                    driver,
                    team,
                    session,
                    ImportMapping.parseInt(row.grid()),
                    ImportMapping.classifiedPosition(row.positionText()),
                    row.positionText(),
                    row.status(),
                    fastestLapRank,
                    ImportMapping.points(row.points()));

            String key = race.getId() + "|" + driver.getId() + "|" + session;
            RaceResult existing = unique.get(key);
            if (existing == null) {
                unique.put(key, candidate);
            } else {
                // A driver listed twice in one session (taking over another car): keep the
                // entry that scored more points.
                log.warn("{} appears twice in {} of {}; keeping the higher-scoring entry",
                        driver.getExternalId(), session, race.getName());
                if (candidate.getActualPoints().compareTo(existing.getActualPoints()) > 0) {
                    unique.put(key, candidate);
                }
            }
        }
    }

    private Circuit findOrCreateCircuit(CircuitDto dto) {
        return circuits.findByExternalId(dto.circuitId()).orElseGet(() -> circuits.save(new Circuit(
                dto.circuitId(),
                dto.circuitName(),
                dto.location() == null ? null : dto.location().locality(),
                dto.location() == null ? null : dto.location().country())));
    }

    private Driver findOrCreateDriver(DriverDto dto) {
        return drivers.findByExternalId(dto.driverId()).orElseGet(() -> drivers.save(new Driver(
                dto.driverId(),
                dto.givenName(),
                dto.familyName(),
                dto.code(),
                dto.nationality(),
                ImportMapping.parseDate(dto.dateOfBirth()))));
    }

    private Team findOrCreateTeam(ResultDto row) {
        return teams.findByExternalId(row.constructor().constructorId()).orElseGet(() -> teams.save(new Team(
                row.constructor().constructorId(),
                row.constructor().name(),
                row.constructor().nationality())));
    }
}
