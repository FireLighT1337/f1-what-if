package com.f1whatif.scoring;

import java.util.Map;

/**
 * How a points system treats a race that ended before its scheduled distance.
 */
public enum ShortenedPolicy {

    /** Shortened races are ignored; every race pays full points. */
    NONE,

    /**
     * The rule used from about 1980 to 2021: no points under two laps, half points up to 75%
     * of the distance, full points from 75%. The fastest-lap point needs 75%.
     */
    HALF_1980,

    /**
     * The rule from 2022: no points unless the leader completed two racing laps, then reduced
     * points tables below 25%, 50% and 75% of the distance, and full points from 75%.
     * The fastest-lap point needs 50%.
     */
    TIERED_2022;

    private static final Map<Integer, Double> UNDER_25 =
            Map.of(1, 6.0, 2, 4.0, 3, 3.0, 4, 2.0, 5, 1.0);
    private static final Map<Integer, Double> UNDER_50 =
            Map.of(1, 13.0, 2, 10.0, 3, 8.0, 4, 6.0, 5, 5.0, 6, 4.0, 7, 3.0, 8, 2.0, 9, 1.0);
    private static final Map<Integer, Double> UNDER_75 =
            Map.of(1, 19.0, 2, 14.0, 3, 12.0, 4, 10.0, 5, 8.0, 6, 6.0, 7, 4.0, 8, 3.0, 9, 2.0, 10, 1.0);

    /** @param distance null means the race ran its full distance */
    public RaceAdjustment adjustmentFor(RaceDistance distance) {
        if (distance == null) {
            return RaceAdjustment.FULL;
        }
        return switch (this) {
            case NONE -> RaceAdjustment.FULL;
            case HALF_1980 -> half1980(distance);
            case TIERED_2022 -> tiered2022(distance);
        };
    }

    private static RaceAdjustment half1980(RaceDistance distance) {
        if (distance.completedLaps() < 2) {
            return RaceAdjustment.NO_POINTS;
        }
        if (distance.fraction() < 0.75) {
            return RaceAdjustment.half();
        }
        return RaceAdjustment.FULL;
    }

    private static RaceAdjustment tiered2022(RaceDistance distance) {
        if (distance.racingLaps() < 2) {
            return RaceAdjustment.NO_POINTS;
        }
        double fraction = distance.fraction();
        if (fraction < 0.25) {
            return RaceAdjustment.table(UNDER_25, false);
        }
        if (fraction < 0.50) {
            return RaceAdjustment.table(UNDER_50, false);
        }
        if (fraction < 0.75) {
            return RaceAdjustment.table(UNDER_75, true);
        }
        return RaceAdjustment.FULL;
    }
}
