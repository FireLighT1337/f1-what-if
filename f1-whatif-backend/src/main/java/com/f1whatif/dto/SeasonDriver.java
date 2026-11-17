package com.f1whatif.dto;

import java.util.List;

/** A driver who raced in a season. The id is what scenarios use to exclude a driver. */
public record SeasonDriver(
        long id,
        String code,
        String name,
        String nationality,
        List<String> teams) {
}
