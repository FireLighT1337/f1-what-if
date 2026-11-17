package com.f1whatif.dto;

import com.f1whatif.scoring.ShortenedPolicy;
import java.math.BigDecimal;
import java.util.Map;

/** A points system in full: points per finishing position and how shortened races are treated. */
public record RulesetDetail(
        String code,
        String name,
        String description,
        Map<Integer, BigDecimal> racePoints,
        Map<Integer, BigDecimal> sprintPoints,
        BigDecimal fastestLapPoint,
        boolean fastestLapRequiresTopTen,
        ShortenedPolicy shortenedPolicy) {
}
