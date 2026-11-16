package com.f1whatif.service;

import com.f1whatif.entity.Race;
import com.f1whatif.entity.RaceResult;
import com.f1whatif.entity.ScoringRuleset;
import com.f1whatif.entity.SessionType;
import com.f1whatif.entity.ShortenedRace;
import com.f1whatif.repository.RaceResultRepository;
import com.f1whatif.repository.ScoringRulesetRepository;
import com.f1whatif.repository.ShortenedRaceRepository;
import com.f1whatif.scoring.RaceDistance;
import com.f1whatif.scoring.ResultEntry;
import com.f1whatif.scoring.ScoringOptions;
import com.f1whatif.scoring.ScoringRules;
import com.f1whatif.scoring.StandingRow;
import com.f1whatif.scoring.StandingsCalculator;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StandingsService {

    private static final Logger log = LoggerFactory.getLogger(StandingsService.class);

    private final RaceResultRepository results;
    private final ScoringRulesetRepository rulesets;
    private final ShortenedRaceRepository shortenedRaces;
    private final StandingsCalculator calculator = new StandingsCalculator();

    public StandingsService(RaceResultRepository results, ScoringRulesetRepository rulesets,
                            ShortenedRaceRepository shortenedRaces) {
        this.results = results;
        this.rulesets = rulesets;
        this.shortenedRaces = shortenedRaces;
    }

    @Transactional(readOnly = true)
    public List<RulesetSummary> listRulesets() {
        return rulesets.findAll().stream()
                .map(r -> new RulesetSummary(r.getCode(), r.getName(), r.getDescription()))
                .toList();
    }

    @Transactional(readOnly = true)
    public StandingsResponse standings(int year, String rulesetCode, ScoringOptions options) {
        ScoringRuleset ruleset = rulesets.findByCode(rulesetCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown ruleset: " + rulesetCode));

        List<RaceResult> rows = results.findByRace_Season_Year(year);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No results for season " + year);
        }

        List<ResultEntry> entries = rows.stream().map(StandingsService::toEntry).toList();
        Map<Long, RaceDistance> distances = shortenedDistances(year, rows);
        List<StandingRow> whatIf = calculator.driverStandings(entries, toRules(ruleset), options, distances);

        Map<Long, String> names = new HashMap<>();
        for (RaceResult row : rows) {
            names.putIfAbsent(row.getDriver().getId(), row.getDriver().getFullName());
        }
        Map<Long, Integer> actualRanks = actualRanks(rows);

        List<StandingsResponse.Row> out = new ArrayList<>();
        for (StandingRow row : whatIf) {
            Integer actual = actualRanks.get(row.driverId());
            Integer change = actual == null ? null : actual - row.rank();
            out.add(new StandingsResponse.Row(
                    row.rank(), row.driverId(), names.get(row.driverId()), row.points(), actual, change));
        }
        return new StandingsResponse(year, ruleset.getCode(), out);
    }

    /** Race id -> distance, for the races of this season that ended early. */
    private Map<Long, RaceDistance> shortenedDistances(int year, List<RaceResult> rows) {
        Map<Integer, ShortenedRace> byRound = new HashMap<>();
        for (ShortenedRace shortened : shortenedRaces.findBySeasonYear(year)) {
            byRound.put(shortened.getRound(), shortened);
        }

        Map<Long, RaceDistance> distances = new HashMap<>();
        for (RaceResult row : rows) {
            Race race = row.getRace();
            ShortenedRace shortened = byRound.get(race.getRound());
            if (shortened != null) {
                distances.putIfAbsent(race.getId(), new RaceDistance(
                        shortened.getScheduledLaps(), shortened.getCompletedLaps(), shortened.getRacingLaps()));
            }
        }
        if (distances.size() < byRound.size()) {
            log.warn("Season {}: {} shortened race(s) have no matching race in the results",
                    year, byRound.size() - distances.size());
        }
        return distances;
    }

    private static ResultEntry toEntry(RaceResult r) {
        return new ResultEntry(
                r.getRace().getId(),
                r.getRace().getRound(),
                r.getDriver().getId(),
                r.getFinishPosition(),
                r.getFastestLapRank() != null && r.getFastestLapRank() == 1,
                r.getSessionType() == SessionType.SPRINT);
    }

    private static ScoringRules toRules(ScoringRuleset ruleset) {
        return new ScoringRules(
                toDoubles(ruleset.getRacePoints()),
                toDoubles(ruleset.getSprintPoints()),
                ruleset.getFastestLapPoint().doubleValue(),
                ruleset.isFastestLapRequiresTopTen(),
                ruleset.getShortenedPolicy());
    }

    private static Map<Integer, Double> toDoubles(Map<Integer, BigDecimal> source) {
        Map<Integer, Double> out = new HashMap<>();
        source.forEach((position, points) -> out.put(position, points.doubleValue()));
        return out;
    }

    /** Real standings from the points awarded at the time. Ties are broken by driver id for now. */
    private static Map<Long, Integer> actualRanks(List<RaceResult> rows) {
        Map<Long, BigDecimal> totals = new HashMap<>();
        for (RaceResult row : rows) {
            totals.merge(row.getDriver().getId(), row.getActualPoints(), BigDecimal::add);
        }
        List<Map.Entry<Long, BigDecimal>> sorted = new ArrayList<>(totals.entrySet());
        sorted.sort((a, b) -> {
            int byPoints = b.getValue().compareTo(a.getValue());
            return byPoints != 0 ? byPoints : Long.compare(a.getKey(), b.getKey());
        });
        Map<Long, Integer> ranks = new HashMap<>();
        int rank = 1;
        for (Map.Entry<Long, BigDecimal> entry : sorted) {
            ranks.put(entry.getKey(), rank++);
        }
        return ranks;
    }
}
