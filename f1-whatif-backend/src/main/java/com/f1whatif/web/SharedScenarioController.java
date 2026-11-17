package com.f1whatif.web;

import com.f1whatif.dto.ScenarioResponse;
import com.f1whatif.service.ScenarioService;
import com.f1whatif.service.StandingsResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public, read-only access to scenarios that their owner has shared. */
@RestController
@RequestMapping("/api/shared")
public class SharedScenarioController {

    private final ScenarioService scenarioService;

    public SharedScenarioController(ScenarioService scenarioService) {
        this.scenarioService = scenarioService;
    }

    @GetMapping("/{publicId}")
    public ScenarioResponse get(@PathVariable String publicId) {
        return scenarioService.getShared(publicId);
    }

    @GetMapping("/{publicId}/standings")
    public StandingsResponse standings(@PathVariable String publicId) {
        return scenarioService.sharedStandings(publicId);
    }
}
