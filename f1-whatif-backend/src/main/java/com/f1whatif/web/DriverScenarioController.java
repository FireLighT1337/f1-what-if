package com.f1whatif.web;

import com.f1whatif.dto.DriverScenarioResponse;
import com.f1whatif.dto.ScenarioQuery;
import com.f1whatif.service.DriverScenarioService;
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
public class DriverScenarioController {

    private final DriverScenarioService driverScenarioService;

    public DriverScenarioController(DriverScenarioService driverScenarioService) {
        this.driverScenarioService = driverScenarioService;
    }

    /** How a driver finished each race of a season under a what-if scenario (same settings as the standings). */
    @GetMapping("/seasons/{year}/drivers/{driverId}/scenario-results")
    public DriverScenarioResponse scenarioResults(
            @PathVariable int year,
            @PathVariable long driverId,
            @RequestParam String ruleset,
            @RequestParam(defaultValue = "true") boolean includeSprints,
            @RequestParam(required = false) Integer countBest,
            @RequestParam(required = false) Set<Long> excludeDrivers,
            @RequestParam(required = false) Set<Integer> excludeRounds) {
        try {
            return driverScenarioService.driverScenario(year, driverId,
                    new ScenarioQuery(ruleset, includeSprints, countBest, excludeDrivers, excludeRounds));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
