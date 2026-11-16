package com.f1whatif.importer;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;

/** Small, pure helpers for turning Jolpica's string fields into typed values. */
final class ImportMapping {

    private ImportMapping() {
    }

    /**
     * The finishing position, but only for classified drivers. Jolpica also fills
     * "position" for retirements, so we use positionText: digits mean classified,
     * letters (R, D, W, ...) mean not classified.
     */
    static Integer classifiedPosition(String positionText) {
        if (positionText == null || !positionText.matches("\\d+")) {
            return null;
        }
        return Integer.valueOf(positionText);
    }

    static BigDecimal points(String value) {
        if (value == null || value.isBlank()) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    static Integer parseInt(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Integer.valueOf(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}
