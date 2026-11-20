package com.f1whatif.aspect;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class ClientAddressTest {

    @Test
    void usesTheDirectConnectionWhenTheHeaderIsNotTrusted() {
        assertEquals("10.0.0.1", ClientAddress.of("1.1.1.1", "10.0.0.1", false, 0));
    }

    @Test
    void usesTheLastEntryWhenOneProxyIsInFront() {
        assertEquals("1.1.1.1", ClientAddress.of("1.1.1.1", "10.0.0.1", true, 0));
        assertEquals("1.1.1.1", ClientAddress.of("6.6.6.6, 1.1.1.1", "10.0.0.1", true, 0));
    }

    @Test
    void ignoresEntriesTheVisitorCouldHaveWritten() {
        assertEquals("1.1.1.1", ClientAddress.of("evil, 6.6.6.6, 1.1.1.1", "10.0.0.1", true, 0));
    }

    @Test
    void countsFromTheRightWhenMoreProxiesAreInFront() {
        assertEquals("1.1.1.1", ClientAddress.of("1.1.1.1, 203.0.113.7", "10.0.0.1", true, 1));
        assertEquals("1.1.1.1", ClientAddress.of("6.6.6.6, 1.1.1.1, 203.0.113.7, 198.51.100.2", "10.0.0.1", true, 2));
    }

    @Test
    void fallsBackToTheDirectConnectionWhenThereAreFewerEntriesThanExpected() {
        assertEquals("10.0.0.1", ClientAddress.of("203.0.113.7", "10.0.0.1", true, 1));
        assertEquals("10.0.0.1", ClientAddress.of("203.0.113.7", "10.0.0.1", true, 5));
    }

    @Test
    void fallsBackWhenTheHeaderIsMissingOrBlank() {
        assertEquals("10.0.0.1", ClientAddress.of(null, "10.0.0.1", true, 0));
        assertEquals("10.0.0.1", ClientAddress.of("  ", "10.0.0.1", true, 0));
    }

    @Test
    void trimsSpacesAndRejectsEmptyEntries() {
        assertEquals("1.1.1.1", ClientAddress.of("6.6.6.6 ,   1.1.1.1  ", "10.0.0.1", true, 0));
        assertEquals("10.0.0.1", ClientAddress.of("1.1.1.1, ", "10.0.0.1", true, 0));
    }

    @Test
    void treatsANegativeSkipAsZero() {
        assertEquals("1.1.1.1", ClientAddress.of("6.6.6.6, 1.1.1.1", "10.0.0.1", true, -3));
    }
}
