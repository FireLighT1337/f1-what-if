package com.f1whatif.service;

import java.util.Set;

/**
 * The scenario switches of a standings request. Records compare by value, so it also works as a cache key.
 *
 * @param countBest null = the season's real counting rule, 0 = all results count, N = best N round totals
 */
public record StandingsQuery(
        Integer countBest,
        boolean includeSprints,
        Set<Long> excludedDriverIds,
        Set<Long> excludedRaceIds) {

    public StandingsQuery {
        if (countBest != null && countBest < 0) {
            throw new IllegalArgumentException("countBest must be 0 or more");
        }
        excludedDriverIds = excludedDriverIds == null ? Set.of() : Set.copyOf(excludedDriverIds);
        excludedRaceIds = excludedRaceIds == null ? Set.of() : Set.copyOf(excludedRaceIds);
    }
}
