package com.f1whatif.scoring;

import java.util.Set;

/**
 * Scenario switches applied on top of a points system.
 *
 * @param counting which round totals count per driver; null means every round counts
 */
public record ScoringOptions(
        boolean includeSprints,
        CountingRule counting,
        Set<Long> excludedDriverIds,
        Set<Long> excludedRaceIds) {

    public ScoringOptions {
        counting = counting == null ? CountingRule.ALL : counting;
        excludedDriverIds = excludedDriverIds == null ? Set.of() : Set.copyOf(excludedDriverIds);
        excludedRaceIds = excludedRaceIds == null ? Set.of() : Set.copyOf(excludedRaceIds);
    }

    public static ScoringOptions defaults() {
        return new ScoringOptions(true, CountingRule.ALL, Set.of(), Set.of());
    }
}
