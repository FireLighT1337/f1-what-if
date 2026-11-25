package com.f1whatif.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record ScenarioRequest(
        @NotBlank @Size(max = 100) String name,
        @Min(1950) @Max(2100) int seasonYear,
        @NotBlank @Size(max = 64) String rulesetCode,
        boolean includeSprints,
        @Min(0) Integer countBest,
        @Size(max = 100) Set<Long> excludedDriverIds,
        @Size(max = 50) Set<Integer> excludedRounds) {
}
