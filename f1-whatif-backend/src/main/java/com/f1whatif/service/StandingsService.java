package com.f1whatif.service;

import com.f1whatif.entity.RaceResult;
import com.f1whatif.entity.ScoringRuleset;
import com.f1whatif.repository.RaceResultRepository;
import com.f1whatif.repository.ScoringRulesetRepository;
import com.f1whatif.repository.ShortenedRaceRepository;
import com.f1whatif.scoring.RaceDistance;
import com.f1whatif.scoring.ResultEntry;
import com.f1whatif.scoring.ScoringOptions;
import com.f1whatif.scoring.StandingRow;
import com.f1whatif.scoring.StandingsCalculator;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StandingsService {

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

    @Cacheable("rulesets")
    @Transactional(readOnly = true)
    public List<RulesetSummary> listRulesets() {
        return rulesets.findAll().stream()
                .map(r -> new RulesetSummary(r.getCode(), r.getName(), r.getDescription()))
                .toList();
    }

    @Cacheable("standings")
    @Transactional(readOnly = true)
    public StandingsResponse standings(int year, String rulesetCode, ScoringOptions options) {
        ScoringRuleset ruleset = rulesets.findByCode(rulesetCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown ruleset: " + rulesetCode));

        List<RaceResult> rows = results.findByRace_Season_Year(year);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No results for season " + year);
        }

        List<ResultEntry> entries = rows.stream().map(ScoringInputs::entry).toList();
        Map<Long, RaceDistance> distances = ScoringInputs.distances(rows, shortenedRaces.findBySeasonYear(year));
        List<StandingRow> whatIf = calculator.driverStandings(entries, ScoringInputs.rules(ruleset), options, distances);

        Map<Long, String> names = new HashMap<>();
        for (RaceResult row : rows) {
            names.putIfAbsent(row.getDriver().getId(), row.getDriver().getFullName());
        }
        Map<Long, Integer> actualRanks = actualRanks(rows, entries);

        List<StandingsResponse.Row> out = new ArrayList<>();
        for (StandingRow row : whatIf) {
            Integer actual = actualRanks.get(row.driverId());
            Integer change = actual == null ? null : actual - row.rank();
            out.add(new StandingsResponse.Row(
                    row.rank(), row.driverId(), names.get(row.driverId()), row.points(), actual, change));
        }
        return new StandingsResponse(year, ruleset.getCode(), out);
    }

    /**
     * The real standings, from the points that were awarded. Ties are split by countback, exactly as in the
     * what-if calculation; otherwise drivers on equal points (often several on zero) would seem to move
     * only because the two rankings break the tie differently.
     */
    private Map<Long, Integer> actualRanks(List<RaceResult> rows, List<ResultEntry> entries) {
        Map<Long, Double> totals = new HashMap<>();
        for (RaceResult row : rows) {
            totals.merge(row.getDriver().getId(), row.getActualPoints().doubleValue(), Double::sum);
        }
        Map<Long, Integer> ranks = new HashMap<>();
        for (StandingRow row : calculator.rankByPoints(entries, totals)) {
            ranks.put(row.driverId(), row.rank());
        }
        return ranks;
    }
}
