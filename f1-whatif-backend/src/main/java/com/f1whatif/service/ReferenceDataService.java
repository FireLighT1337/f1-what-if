package com.f1whatif.service;

import com.f1whatif.dto.RaceInfo;
import com.f1whatif.dto.RulesetDetail;
import com.f1whatif.dto.SeasonDriver;
import com.f1whatif.dto.SeasonDriverRow;
import com.f1whatif.dto.SeasonSummary;
import com.f1whatif.entity.Race;
import com.f1whatif.entity.ScoringRuleset;
import com.f1whatif.entity.ShortenedRace;
import com.f1whatif.repository.ReferenceQueryRepository;
import com.f1whatif.repository.ScoringRulesetRepository;
import com.f1whatif.repository.ShortenedRaceRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Lists the frontend needs to build a scenario: seasons, the races and drivers of a season,
 * and the details of a points system. The data only changes when something is imported, so
 * results are cached (see the "reference" cache in application.yml).
 */
@Service
public class ReferenceDataService {

    private final ReferenceQueryRepository reference;
    private final ShortenedRaceRepository shortenedRaces;
    private final ScoringRulesetRepository rulesets;

    public ReferenceDataService(ReferenceQueryRepository reference, ShortenedRaceRepository shortenedRaces,
                                ScoringRulesetRepository rulesets) {
        this.reference = reference;
        this.shortenedRaces = shortenedRaces;
        this.rulesets = rulesets;
    }

    /** Seasons that have data, newest first. */
    @Cacheable(cacheNames = "reference", key = "'seasons'")
    @Transactional(readOnly = true)
    public List<SeasonSummary> seasons() {
        return reference.findSeasonSummaries();
    }

    @Cacheable(cacheNames = "reference", key = "'races:' + #year")
    @Transactional(readOnly = true)
    public List<RaceInfo> races(int year) {
        List<Race> races = reference.findRacesWithCircuit(year);
        if (races.isEmpty()) {
            throw noSeason(year);
        }
        Map<Integer, ShortenedRace> shortenedByRound = new HashMap<>();
        for (ShortenedRace shortened : shortenedRaces.findBySeasonYear(year)) {
            shortenedByRound.put(shortened.getRound(), shortened);
        }

        List<RaceInfo> out = new ArrayList<>();
        for (Race race : races) {
            ShortenedRace shortened = shortenedByRound.get(race.getRound());
            out.add(new RaceInfo(
                    race.getRound(),
                    race.getName(),
                    race.getRaceDate(),
                    race.getCircuit().getName(),
                    race.getCircuit().getLocality(),
                    race.getCircuit().getCountry(),
                    race.isHasSprint(),
                    shortened != null,
                    shortened == null ? null : shortened.getNote()));
        }
        return out;
    }

    /** Drivers of a season, sorted by family name, with every team they raced for. */
    @Cacheable(cacheNames = "reference", key = "'drivers:' + #year")
    @Transactional(readOnly = true)
    public List<SeasonDriver> drivers(int year) {
        List<SeasonDriverRow> rows = reference.findSeasonDriverRows(year);
        if (rows.isEmpty()) {
            throw noSeason(year);
        }
        // The rows are sorted, so a driver's rows are next to each other and the order is kept.
        Map<Long, SeasonDriverRow> firstRowOfDriver = new LinkedHashMap<>();
        Map<Long, List<String>> teamsOfDriver = new HashMap<>();
        for (SeasonDriverRow row : rows) {
            firstRowOfDriver.putIfAbsent(row.id(), row);
            teamsOfDriver.computeIfAbsent(row.id(), id -> new ArrayList<>()).add(row.team());
        }

        List<SeasonDriver> out = new ArrayList<>();
        for (SeasonDriverRow row : firstRowOfDriver.values()) {
            out.add(new SeasonDriver(
                    row.id(),
                    row.code(),
                    row.givenName() + " " + row.familyName(),
                    row.nationality(),
                    teamsOfDriver.get(row.id())));
        }
        return out;
    }

    @Cacheable(cacheNames = "reference", key = "'ruleset:' + #code")
    @Transactional(readOnly = true)
    public RulesetDetail ruleset(String code) {
        ScoringRuleset ruleset = rulesets.findByCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown ruleset: " + code));
        return new RulesetDetail(
                ruleset.getCode(),
                ruleset.getName(),
                ruleset.getDescription(),
                new TreeMap<>(ruleset.getRacePoints()),
                new TreeMap<>(ruleset.getSprintPoints()),
                ruleset.getFastestLapPoint(),
                ruleset.isFastestLapRequiresTopTen(),
                ruleset.getShortenedPolicy());
    }

    private static ResponseStatusException noSeason(int year) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "No data for season " + year);
    }
}
