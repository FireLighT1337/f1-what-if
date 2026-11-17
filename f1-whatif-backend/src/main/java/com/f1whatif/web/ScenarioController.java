package com.f1whatif.web;

import com.f1whatif.dto.ScenarioRequest;
import com.f1whatif.dto.ScenarioResponse;
import com.f1whatif.service.ScenarioService;
import com.f1whatif.service.StandingsResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/scenarios")
@SecurityRequirement(name = "bearerAuth")
public class ScenarioController {

    private final ScenarioService scenarioService;

    public ScenarioController(ScenarioService scenarioService) {
        this.scenarioService = scenarioService;
    }

    @GetMapping
    public List<ScenarioResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return scenarioService.list(CurrentUser.id(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ScenarioResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ScenarioRequest request) {
        return scenarioService.create(CurrentUser.id(jwt), request);
    }

    @GetMapping("/{id}")
    public ScenarioResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        return scenarioService.get(CurrentUser.id(jwt), id);
    }

    @PutMapping("/{id}")
    public ScenarioResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable long id,
                                   @Valid @RequestBody ScenarioRequest request) {
        return scenarioService.update(CurrentUser.id(jwt), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        scenarioService.delete(CurrentUser.id(jwt), id);
    }

    @GetMapping("/{id}/standings")
    public StandingsResponse standings(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        return scenarioService.standings(CurrentUser.id(jwt), id);
    }

    @PostMapping("/{id}/share")
    public ScenarioResponse share(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        return scenarioService.share(CurrentUser.id(jwt), id);
    }

    @DeleteMapping("/{id}/share")
    public ScenarioResponse unshare(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        return scenarioService.unshare(CurrentUser.id(jwt), id);
    }
}
