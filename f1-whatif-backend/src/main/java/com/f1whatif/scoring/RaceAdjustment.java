package com.f1whatif.scoring;

import java.util.Map;

/**
 * What a shortened race does to the points of one race.
 *
 * @param factor            multiplies the points from the points table
 * @param replacementPoints if not null, this table is used instead of the points table
 * @param fastestLapAllowed whether the fastest-lap point can still be awarded
 */
public record RaceAdjustment(double factor, Map<Integer, Double> replacementPoints, boolean fastestLapAllowed) {

    public static final RaceAdjustment FULL = new RaceAdjustment(1.0, null, true);
    public static final RaceAdjustment NO_POINTS = new RaceAdjustment(0.0, null, false);

    public static RaceAdjustment half() {
        return new RaceAdjustment(0.5, null, false);
    }

    public static RaceAdjustment table(Map<Integer, Double> points, boolean fastestLapAllowed) {
        return new RaceAdjustment(1.0, points, fastestLapAllowed);
    }
}
