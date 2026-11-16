package com.f1whatif.importer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class ImportMappingTest {

    @Test
    void numericPositionTextIsClassified() {
        assertEquals(Integer.valueOf(1), ImportMapping.classifiedPosition("1"));
        assertEquals(Integer.valueOf(14), ImportMapping.classifiedPosition("14"));
    }

    @Test
    void lettersOrMissingPositionTextMeanNotClassified() {
        assertNull(ImportMapping.classifiedPosition("R"));
        assertNull(ImportMapping.classifiedPosition("D"));
        assertNull(ImportMapping.classifiedPosition(""));
        assertNull(ImportMapping.classifiedPosition(null));
    }

    @Test
    void pointsAreParsedAndDefaultToZero() {
        assertEquals(new BigDecimal("12.5"), ImportMapping.points("12.5"));
        assertEquals(new BigDecimal("25"), ImportMapping.points("25"));
        assertEquals(BigDecimal.ZERO, ImportMapping.points(null));
        assertEquals(BigDecimal.ZERO, ImportMapping.points("n/a"));
    }

    @Test
    void datesAndIntegersAreParsedLeniently() {
        assertEquals(LocalDate.of(1961, 4, 23), ImportMapping.parseDate("1961-04-23"));
        assertNull(ImportMapping.parseDate("not a date"));
        assertNull(ImportMapping.parseDate(null));
        assertEquals(Integer.valueOf(3), ImportMapping.parseInt("3"));
        assertNull(ImportMapping.parseInt(""));
    }
}
