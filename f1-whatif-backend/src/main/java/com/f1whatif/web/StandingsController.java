package com.f1whatif.web;

import com.f1whatif.service.RulesetSummary;
import com.f1whatif.service.StandingsQuery;
import com.f1whatif.service.StandingsResponse;
import com.f1whatif.service.StandingsService;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class StandingsController {

    private final StandingsService standingsService;

    public StandingsController(StandingsService standingsService) {
        this.standingsService = standingsService;
    }

    @GetMapping("/rulesets")
    public List<RulesetSummary> rulesets() {
        return standingsService.listRulesets();
    }

    @GetMapping("/seasons/{year}/standings")
    public StandingsResponse standings(
            @PathVariable int year,
            @RequestParam(defaultValue = "current-2025") String ruleset,
            @RequestParam(defaultValue = "true") boolean includeSprints,
            @RequestParam(required = false) Integer countBest,
            @RequestParam(required = false) Set<Long> excludeDrivers,
            @RequestParam(required = false) Set<Long> excludeRaces) {
        try {
            return standingsService.standings(year, ruleset,
                    new StandingsQuery(countBest, includeSprints, excludeDrivers, excludeRaces));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
