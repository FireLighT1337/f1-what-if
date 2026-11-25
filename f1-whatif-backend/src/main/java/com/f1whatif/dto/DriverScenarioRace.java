package com.f1whatif.dto;

import java.time.LocalDate;

/**
 * One race of the season for a driver under a scenario.
 *
 * excluded: the scenario leaves this race out. counted: false for excluded races and for rounds
 * that do not count because only the best results count. finishPosition is the position the
 * scenario gives (other drivers may have been removed), points the points it awards for the race.
 */
public record DriverScenarioRace(
        int round,
        String raceName,
        LocalDate date,
        boolean shortened,
        boolean entered,
        boolean excluded,
        String team,
        Integer grid,
        String status,
        Integer realFinishPosition,
        String realPositionText,
        Integer finishPosition,
        double points,
        boolean counted,
        DriverScenarioSprint sprint) {
}
