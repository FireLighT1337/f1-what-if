package com.f1whatif.scoring;

import java.util.Set;

/**
 * Scenario switches applied on top of a points system.
 *
 * @param countBest only the best N round totals count per driver; null means all rounds count
 */
public record ScoringOptions(
        boolean includeSprints,
        Integer countBest,
        Set<Long> excludedDriverIds,
        Set<Long> excludedRaceIds) {

    public ScoringOptions {
        if (countBest != null && countBest < 1) {
            throw new IllegalArgumentException("countBest must be at least 1");
        }
        excludedDriverIds = excludedDriverIds == null ? Set.of() : Set.copyOf(excludedDriverIds);
        excludedRaceIds = excludedRaceIds == null ? Set.of() : Set.copyOf(excludedRaceIds);
    }

    public static ScoringOptions defaults() {
        return new ScoringOptions(true, null, Set.of(), Set.of());
    }
}
