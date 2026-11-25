package com.f1whatif.dto;

import java.util.Set;

/** The settings of a scenario as they arrive in a request. Records compare by value, so it also works as a cache key. */
public record ScenarioQuery(
        String rulesetCode,
        boolean includeSprints,
        Integer countBest,
        Set<Long> excludedDriverIds,
        Set<Integer> excludedRounds) {

    public ScenarioQuery {
        if (countBest != null && countBest < 1) {
            throw new IllegalArgumentException("countBest must be at least 1");
        }
        excludedDriverIds = excludedDriverIds == null ? Set.of() : Set.copyOf(excludedDriverIds);
        excludedRounds = excludedRounds == null ? Set.of() : Set.copyOf(excludedRounds);
    }
}
