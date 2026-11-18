package com.f1whatif.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One race of the season from a driver's point of view. When the driver did not take part,
 * entered is false and the result fields are null. finishPosition is null when the driver was
 * not classified; positionText then says why (R retired, D disqualified, W withdrew, ...).
 * points are those actually awarded for the race, not including the sprint.
 */
public record DriverRaceResult(
        int round,
        String raceName,
        LocalDate date,
        boolean shortened,
        boolean entered,
        String team,
        Integer grid,
        Integer finishPosition,
        String positionText,
        String status,
        BigDecimal points,
        SprintResultInfo sprint) {
}
