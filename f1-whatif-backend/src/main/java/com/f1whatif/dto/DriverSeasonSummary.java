package com.f1whatif.dto;

import java.math.BigDecimal;

/** Totals over the season; points are the real points, sprints included. */
public record DriverSeasonSummary(int racesEntered, int wins, int podiums, BigDecimal points) {
}
