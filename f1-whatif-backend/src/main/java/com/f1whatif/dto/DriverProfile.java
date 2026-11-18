package com.f1whatif.dto;

import java.time.LocalDate;

public record DriverProfile(
        long id,
        String name,
        String code,
        String nationality,
        LocalDate dateOfBirth,
        String wikipediaUrl) {
}
