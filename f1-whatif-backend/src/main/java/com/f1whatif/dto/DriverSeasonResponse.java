package com.f1whatif.dto;

import java.util.List;

public record DriverSeasonResponse(
        DriverProfile driver,
        int season,
        DriverSeasonSummary summary,
        List<DriverRaceResult> races) {
}
