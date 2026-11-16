package com.f1whatif.scoring;

import java.util.Map;

/**
 * A points system: finishing position -> points, for races and sprints, plus how it
 * treats races that ended early.
 */
public record ScoringRules(
        Map<Integer, Double> racePoints,
        Map<Integer, Double> sprintPoints,
        double fastestLapPoint,
        boolean fastestLapRequiresTopTen,
        ShortenedPolicy shortenedPolicy) {

    public ScoringRules {
        racePoints = Map.copyOf(racePoints);
        sprintPoints = Map.copyOf(sprintPoints);
        shortenedPolicy = shortenedPolicy == null ? ShortenedPolicy.NONE : shortenedPolicy;
    }

    /** A points system that ignores shortened races. */
    public ScoringRules(
            Map<Integer, Double> racePoints,
            Map<Integer, Double> sprintPoints,
            double fastestLapPoint,
            boolean fastestLapRequiresTopTen) {
        this(racePoints, sprintPoints, fastestLapPoint, fastestLapRequiresTopTen, ShortenedPolicy.NONE);
    }
}
