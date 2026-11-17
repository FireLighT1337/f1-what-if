package com.f1whatif.dto;

/** One driver and one team they raced for in a season; filled by a JPQL constructor expression. */
public record SeasonDriverRow(
        Long id,
        String code,
        String givenName,
        String familyName,
        String nationality,
        String team) {
}
