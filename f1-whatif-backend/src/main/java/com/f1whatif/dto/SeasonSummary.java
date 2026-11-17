package com.f1whatif.dto;

/** One season with data. Wrapper types because a JPQL constructor expression fills this record. */
public record SeasonSummary(Integer year, Long raceCount, Long sprintRaceCount) {
}
