package com.f1whatif.dto;

/** A sprint under a scenario: what happened for real, and the position and points the scenario gives. */
public record DriverScenarioSprint(
        Integer realFinishPosition,
        String realPositionText,
        Integer finishPosition,
        double points) {
}
