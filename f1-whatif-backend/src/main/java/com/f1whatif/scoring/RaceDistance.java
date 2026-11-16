package com.f1whatif.scoring;

/**
 * How much of a race was run. Only needed for races that ended early.
 *
 * @param scheduledLaps laps the race was scheduled for
 * @param completedLaps laps completed by the leader, including laps behind the safety car
 *                      (older rules count these)
 * @param racingLaps    laps the leader completed in racing conditions, without the safety car
 *                      (the 2022 rules count only these)
 */
public record RaceDistance(int scheduledLaps, int completedLaps, int racingLaps) {

    public RaceDistance {
        if (scheduledLaps < 1
                || completedLaps < 0 || completedLaps > scheduledLaps
                || racingLaps < 0 || racingLaps > completedLaps) {
            throw new IllegalArgumentException(
                    "Invalid race distance: " + scheduledLaps + " scheduled, "
                            + completedLaps + " completed, " + racingLaps + " racing");
        }
    }

    /** Share of the scheduled distance that was completed, from 0 to 1. */
    public double fraction() {
        return (double) completedLaps / scheduledLaps;
    }
}
