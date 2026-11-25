package com.f1whatif.scoring;

import java.util.List;

/** One driver's season under a scenario: rank, total points and every round. */
public record DriverBreakdown(int rank, double points, List<RoundBreakdown> rounds) {
}
