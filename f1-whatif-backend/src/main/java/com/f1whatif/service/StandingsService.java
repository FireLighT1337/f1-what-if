package com.f1whatif.service;

import com.f1whatif.entity.RaceResult;
import com.f1whatif.entity.ScoringRuleset;
import com.f1whatif.repository.RaceResultRepository;
import com.f1whatif.repository.ScoringRulesetRepository;
import com.f1whatif.entity.SeasonRule;
import com.f1whatif.repository.RaceMultiplierRepository;
import com.f1whatif.repository.SeasonRuleRepository;
import com.f1whatif.repository.ShortenedRaceRepository;
import com.f1whatif.scoring.CountingRule;
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
    private final SeasonRuleRepository seasonRules;
    private final RaceMultiplierRepository raceMultipliers;
    private final StandingsCalculator calculator = new StandingsCalculator();

    public StandingsService(RaceResultRepository results, ScoringRulesetRepository rulesets,
                            ShortenedRaceRepository shortenedRaces, SeasonRuleRepository seasonRules,
                            RaceMultiplierRepository raceMultipliers) {
        this.results = results;
        this.rulesets = rulesets;
        this.shortenedRaces = shortenedRaces;
        this.seasonRules = seasonRules;
        this.raceMultipliers = raceMultipliers;
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
    public StandingsResponse standings(int year, String rulesetCode, StandingsQuery query) {
        ScoringRuleset ruleset = rulesets.findByCode(rulesetCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown ruleset: " + rulesetCode));

        List<RaceResult> rows = results.findByRace_Season_Year(year);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No results for season " + year);
        }

        List<ResultEntry> entries = rows.stream().map(ScoringInputs::entry).toList();
        Map<Long, RaceDistance> distances = ScoringInputs.distances(rows, shortenedRaces.findBySeasonYear(year));
        SeasonRule seasonRule = seasonRules.findById(year).orElse(null);
        CountingRule counting = ScoringInputs.counting(query.countBest(), seasonRule);
        ScoringOptions options = new ScoringOptions(query.includeSprints(), counting,
                query.excludedDriverIds(), query.excludedRaceIds());
        Map<Integer, Double> multipliers = ScoringInputs.multipliers(raceMultipliers.findBySeasonYear(year));
        List<StandingRow> whatIf = calculator.driverStandings(
                entries, ScoringInputs.rules(ruleset), options, distances, multipliers);

        Map<Long, String> names = new HashMap<>();
        for (RaceResult row : rows) {
            names.putIfAbsent(row.getDriver().getId(), row.getDriver().getFullName());
        }
        Map<Long, Integer> actualRanks = actualRanks(rows, entries, ScoringInputs.seasonCounting(seasonRule));

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
     * The real standings, from the points that were awarded and counted under the season's own rule (for
     * example only the best 11 results in 1988). Ties are split by countback, exactly as in the what-if
     * calculation; otherwise drivers on equal points (often several on zero) would seem to move only
     * because the two rankings break the tie differently.
     */
    private Map<Long, Integer> actualRanks(List<RaceResult> rows, List<ResultEntry> entries, CountingRule rule) {
        Map<Long, Map<Integer, Double>> pointsByDriver = new HashMap<>();
        for (RaceResult row : rows) {
            pointsByDriver.computeIfAbsent(row.getDriver().getId(), id -> new HashMap<>())
                    .merge(row.getRace().getRound(), row.getActualPoints().doubleValue(), Double::sum);
        }
        Map<Long, Double> totals = new HashMap<>();
        pointsByDriver.forEach((driverId, byRound) -> totals.put(driverId, rule.total(byRound)));
        Map<Long, Integer> ranks = new HashMap<>();
        for (StandingRow row : calculator.rankByPoints(entries, totals)) {
            ranks.put(row.driverId(), row.rank());
        }
        return ranks;
    }
}
