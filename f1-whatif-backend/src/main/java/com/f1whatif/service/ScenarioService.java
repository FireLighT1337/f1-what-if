package com.f1whatif.service;

import com.f1whatif.dto.ScenarioRequest;
import com.f1whatif.dto.ScenarioResponse;
import com.f1whatif.entity.AppUser;
import com.f1whatif.entity.Race;
import com.f1whatif.entity.Scenario;
import com.f1whatif.repository.AppUserRepository;
import com.f1whatif.repository.DriverRepository;
import com.f1whatif.repository.RaceQueryRepository;
import com.f1whatif.repository.ScenarioRepository;
import com.f1whatif.repository.ScoringRulesetRepository;
import com.f1whatif.repository.SeasonRepository;
import com.f1whatif.scoring.ScoringOptions;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Saved scenarios. Every method takes the id of the logged-in user and only touches
 * that user's scenarios; someone else's scenario looks the same as one that does not exist.
 */
@Service
public class ScenarioService {

    static final int MAX_SCENARIOS_PER_USER = 50;

    private final ScenarioRepository scenarios;
    private final AppUserRepository users;
    private final ScoringRulesetRepository rulesets;
    private final SeasonRepository seasons;
    private final DriverRepository drivers;
    private final RaceQueryRepository races;
    private final StandingsService standingsService;

    public ScenarioService(ScenarioRepository scenarios, AppUserRepository users, ScoringRulesetRepository rulesets,
                           SeasonRepository seasons, DriverRepository drivers, RaceQueryRepository races,
                           StandingsService standingsService) {
        this.scenarios = scenarios;
        this.users = users;
        this.rulesets = rulesets;
        this.seasons = seasons;
        this.drivers = drivers;
        this.races = races;
        this.standingsService = standingsService;
    }

    @Transactional(readOnly = true)
    public List<ScenarioResponse> list(long userId) {
        return scenarios.findByOwner_IdOrderByUpdatedAtDesc(userId).stream()
                .map(ScenarioResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ScenarioResponse get(long userId, long scenarioId) {
        return ScenarioResponse.from(owned(userId, scenarioId));
    }

    @Transactional
    public ScenarioResponse create(long userId, ScenarioRequest request) {
        validate(request);
        if (scenarios.countByOwner_Id(userId) >= MAX_SCENARIOS_PER_USER) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You can save at most " + MAX_SCENARIOS_PER_USER + " scenarios");
        }
        AppUser owner = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));
        Scenario scenario = new Scenario(owner, request.name().trim(), request.seasonYear(), request.rulesetCode(),
                request.includeSprints(), request.countBest(), request.excludedDriverIds(), request.excludedRounds());
        return ScenarioResponse.from(scenarios.save(scenario));
    }

    @Transactional
    public ScenarioResponse update(long userId, long scenarioId, ScenarioRequest request) {
        validate(request);
        Scenario scenario = owned(userId, scenarioId);
        scenario.update(request.name().trim(), request.seasonYear(), request.rulesetCode(),
                request.includeSprints(), request.countBest(), request.excludedDriverIds(), request.excludedRounds());
        return ScenarioResponse.from(scenario);
    }

    @Transactional
    public void delete(long userId, long scenarioId) {
        scenarios.delete(owned(userId, scenarioId));
    }

    @Transactional
    public ScenarioResponse share(long userId, long scenarioId) {
        Scenario scenario = owned(userId, scenarioId);
        scenario.share();
        return ScenarioResponse.from(scenario);
    }

    @Transactional
    public ScenarioResponse unshare(long userId, long scenarioId) {
        Scenario scenario = owned(userId, scenarioId);
        scenario.unshare();
        return ScenarioResponse.from(scenario);
    }

    @Transactional(readOnly = true)
    public StandingsResponse standings(long userId, long scenarioId) {
        return standingsFor(owned(userId, scenarioId));
    }

    /** The scenario behind a share link; no login needed. */
    @Transactional(readOnly = true)
    public ScenarioResponse getShared(String publicId) {
        return ScenarioResponse.from(shared(publicId));
    }

    @Transactional(readOnly = true)
    public StandingsResponse sharedStandings(String publicId) {
        return standingsFor(shared(publicId));
    }

    private StandingsResponse standingsFor(Scenario scenario) {
        Set<Long> excludedRaceIds = new HashSet<>();
        if (!scenario.getExcludedRounds().isEmpty()) {
            for (Race race : races.findBySeason_Year(scenario.getSeasonYear())) {
                if (scenario.getExcludedRounds().contains(race.getRound())) {
                    excludedRaceIds.add(race.getId());
                }
            }
        }
        ScoringOptions options = new ScoringOptions(scenario.isIncludeSprints(), scenario.getCountBest(),
                scenario.getExcludedDriverIds(), excludedRaceIds);
        return standingsService.standings(scenario.getSeasonYear(), scenario.getRulesetCode(), options);
    }

    private Scenario owned(long userId, long scenarioId) {
        return scenarios.findByIdAndOwner_Id(scenarioId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scenario not found"));
    }

    private Scenario shared(String publicId) {
        return scenarios.findByPublicId(publicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scenario not found"));
    }

    private void validate(ScenarioRequest request) {
        if (rulesets.findByCode(request.rulesetCode()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown ruleset: " + request.rulesetCode());
        }
        if (!seasons.existsById(request.seasonYear())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No data for season " + request.seasonYear());
        }
        Set<Long> driverIds = request.excludedDriverIds();
        if (driverIds != null && !driverIds.isEmpty() && drivers.findAllById(driverIds).size() != driverIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown driver id in excludedDriverIds");
        }
    }
}
