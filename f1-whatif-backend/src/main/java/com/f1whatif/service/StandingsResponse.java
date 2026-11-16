package com.f1whatif.service;

import java.util.List;

public record StandingsResponse(int season, String ruleset, List<Row> standings) {

    /**
     * @param positionChange places gained (positive) or lost (negative) compared with the real standings
     */
    public record Row(
            int rank,
            long driverId,
            String driver,
            double points,
            Integer actualRank,
            Integer positionChange) {
    }
}
