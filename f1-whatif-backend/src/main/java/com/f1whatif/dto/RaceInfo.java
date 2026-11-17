package com.f1whatif.dto;

import java.time.LocalDate;

/**
 * A race of a season. The round number is how scenarios refer to a race.
 * shortenedNote is null unless the race ended early and paid reduced points.
 */
public record RaceInfo(
        int round,
        String name,
        LocalDate date,
        String circuit,
        String locality,
        String country,
        boolean hasSprint,
        boolean shortened,
        String shortenedNote) {
}
