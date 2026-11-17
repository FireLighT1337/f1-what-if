package com.f1whatif.dto;

import com.f1whatif.entity.Scenario;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

/** publicId is null unless the scenario is shared. */
public record ScenarioResponse(
        long id,
        String name,
        int seasonYear,
        String rulesetCode,
        boolean includeSprints,
        Integer countBest,
        List<Long> excludedDriverIds,
        List<Integer> excludedRounds,
        String publicId,
        Instant createdAt,
        Instant updatedAt) {

    public static ScenarioResponse from(Scenario scenario) {
        return new ScenarioResponse(
                scenario.getId(),
                scenario.getName(),
                scenario.getSeasonYear(),
                scenario.getRulesetCode(),
                scenario.isIncludeSprints(),
                scenario.getCountBest(),
                scenario.getExcludedDriverIds().stream().sorted().toList(),
                scenario.getExcludedRounds().stream().sorted().toList(),
                scenario.getPublicId(),
                scenario.getCreatedAt().toInstant(ZoneOffset.UTC),
                scenario.getUpdatedAt().toInstant(ZoneOffset.UTC));
    }
}
