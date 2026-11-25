package com.f1whatif.scoring;

/**
 * What one driver scored in one round of a scenario.
 *
 * @param racePosition   position in the race after exclusions, or null if not classified or no race entry
 * @param sprintPosition the same for the sprint
 * @param counted        false when the round does not count because only the best results count
 */
public record RoundBreakdown(
        int round,
        boolean hasRace,
        Integer racePosition,
        double racePoints,
        boolean hasSprint,
        Integer sprintPosition,
        double sprintPoints,
        boolean counted) {

    public double points() {
        return racePoints + sprintPoints;
    }
}
