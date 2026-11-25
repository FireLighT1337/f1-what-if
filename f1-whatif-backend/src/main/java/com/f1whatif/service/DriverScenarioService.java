package com.f1whatif.service;

import com.f1whatif.dto.DriverRaceResult;
import com.f1whatif.dto.DriverScenarioRace;
import com.f1whatif.dto.DriverScenarioResponse;
import com.f1whatif.dto.DriverScenarioSprint;
import com.f1whatif.dto.DriverScenarioSummary;
import com.f1whatif.dto.DriverSeasonResponse;
import com.f1whatif.dto.ScenarioQuery;
import com.f1whatif.dto.SprintResultInfo;
import com.f1whatif.entity.RaceResult;
import com.f1whatif.entity.ScoringRuleset;
import com.f1whatif.repository.RaceResultRepository;
import com.f1whatif.repository.ScoringRulesetRepository;
import com.f1whatif.repository.ShortenedRaceRepository;
import com.f1whatif.scoring.DriverBreakdown;
import com.f1whatif.scoring.RoundBreakdown;
import com.f1whatif.scoring.ScoringOptions;
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

/**
 * How one driver finished every race of a season under a what-if scenario: the positions and
 * points the scenario gives, next to what really happened. Uses the same scoring engine as the standings.
 */
@Service
public class DriverScenarioService {

    private final DriverSeasonService realResults;
    private final RaceResultRepository results;
    private final ScoringRulesetRepository rulesets;
    private final ShortenedRaceRepository shortenedRaces;
    private final StandingsCalculator calculator = new StandingsCalculator();

    public DriverScenarioService(DriverSeasonService realResults, RaceResultRepository results,
                                 ScoringRulesetRepository rulesets, ShortenedRaceRepository shortenedRaces) {
        this.realResults = realResults;
        this.results = results;
        this.rulesets = rulesets;
        this.shortenedRaces = shortenedRaces;
    }

    @Cacheable(cacheNames = "reference", key = "T(java.util.List).of(#year, #driverId, #query)")
    @Transactional(readOnly = true)
    public DriverScenarioResponse driverScenario(int year, long driverId, ScenarioQuery query) {
        DriverSeasonResponse real = realResults.driverSeason(year, driverId);
        ScoringRuleset ruleset = rulesets.findByCode(query.rulesetCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown ruleset: " + query.rulesetCode()));
        if (query.excludedDriverIds().contains(driverId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This driver is excluded in the scenario");
        }

        List<RaceResult> rows = results.findByRace_Season_Year(year);
        ScoringOptions options = new ScoringOptions(query.includeSprints(), query.countBest(),
                query.excludedDriverIds(), ScoringInputs.raceIdsOfRounds(rows, query.excludedRounds()));
        DriverBreakdown breakdown = calculator.driverBreakdown(
                rows.stream().map(ScoringInputs::entry).toList(),
                ScoringInputs.rules(ruleset),
                options,
                ScoringInputs.distances(rows, shortenedRaces.findBySeasonYear(year)),
                driverId);
        if (breakdown == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "The driver has no results left in this scenario");
        }

        Map<Integer, RoundBreakdown> byRound = new HashMap<>();
        for (RoundBreakdown round : breakdown.rounds()) {
            byRound.put(round.round(), round);
        }

        List<DriverScenarioRace> races = new ArrayList<>();
        int wins = 0;
        int podiums = 0;
        int counted = 0;
        for (DriverRaceResult realRace : real.races()) {
            boolean excluded = query.excludedRounds().contains(realRace.round());
            RoundBreakdown scenario = byRound.get(realRace.round());
            if (!realRace.entered() || excluded || scenario == null) {
                races.add(new DriverScenarioRace(realRace.round(), realRace.raceName(), realRace.date(),
                        realRace.shortened(), realRace.entered(), excluded, realRace.team(), realRace.grid(),
                        realRace.status(), realRace.finishPosition(), realRace.positionText(),
                        null, 0.0, false, null));
                continue;
            }

            Integer position = scenario.racePosition();
            if (position != null && position == 1) {
                wins++;
            }
            if (position != null && position <= 3) {
                podiums++;
            }
            if (scenario.hasRace() && scenario.counted()) {
                counted++;
            }
            races.add(new DriverScenarioRace(realRace.round(), realRace.raceName(), realRace.date(),
                    realRace.shortened(), true, false, realRace.team(), realRace.grid(), realRace.status(),
                    realRace.finishPosition(), realRace.positionText(),
                    position, scenario.racePoints(), scenario.counted(), sprintOf(realRace.sprint(), scenario, query)));
        }

        return new DriverScenarioResponse(real.driver(), year, ruleset.getCode(), ruleset.getName(),
                query.includeSprints(), query.countBest(),
                new DriverScenarioSummary(breakdown.rank(), breakdown.points(), counted, wins, podiums), races);
    }

    private static DriverScenarioSprint sprintOf(SprintResultInfo real, RoundBreakdown scenario, ScenarioQuery query) {
        if (!query.includeSprints() || !scenario.hasSprint()) {
            return null;
        }
        return new DriverScenarioSprint(
                real == null ? null : real.finishPosition(),
                real == null ? null : real.positionText(),
                scenario.sprintPosition(),
                scenario.sprintPoints());
    }
}
