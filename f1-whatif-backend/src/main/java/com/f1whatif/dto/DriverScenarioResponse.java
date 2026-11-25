package com.f1whatif.dto;

import java.util.List;

public record DriverScenarioResponse(
        DriverProfile driver,
        int season,
        String rulesetCode,
        String rulesetName,
        boolean includeSprints,
        Integer countBest,
        DriverScenarioSummary summary,
        List<DriverScenarioRace> races) {
}
