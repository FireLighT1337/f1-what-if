package com.f1whatif.aspect;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class FixedWindowRateLimiterTest {

    private long now = 0;

    private FixedWindowRateLimiter limiter(int maxRequests, Duration window) {
        return new FixedWindowRateLimiter(maxRequests, window, () -> now);
    }

    private static long seconds(long value) {
        return value * 1_000_000_000L;
    }

    @Test
    void allowsRequestsUpToTheLimitAndRejectsTheNext() {
        FixedWindowRateLimiter limiter = limiter(3, Duration.ofSeconds(60));

        assertTrue(limiter.tryAcquire("a").allowed());
        assertTrue(limiter.tryAcquire("a").allowed());
        assertTrue(limiter.tryAcquire("a").allowed());
        assertFalse(limiter.tryAcquire("a").allowed());
    }

    @Test
    void tellsTheClientHowLongToWait() {
        FixedWindowRateLimiter limiter = limiter(1, Duration.ofSeconds(60));
        limiter.tryAcquire("a");
        now = seconds(10);

        FixedWindowRateLimiter.Decision decision = limiter.tryAcquire("a");

        assertFalse(decision.allowed());
        assertEquals(50L, decision.retryAfterSeconds());
    }

    @Test
    void roundsTheWaitUpToWholeSeconds() {
        FixedWindowRateLimiter limiter = limiter(1, Duration.ofSeconds(60));
        limiter.tryAcquire("a");
        now = seconds(59) + 500_000_000L;

        assertEquals(1L, limiter.tryAcquire("a").retryAfterSeconds());
    }

    @Test
    void keysAreCountedSeparately() {
        FixedWindowRateLimiter limiter = limiter(1, Duration.ofSeconds(60));

        assertTrue(limiter.tryAcquire("a").allowed());
        assertFalse(limiter.tryAcquire("a").allowed());
        assertTrue(limiter.tryAcquire("b").allowed());
    }

    @Test
    void aNewWindowStartsOnceTheOldOneHasPassed() {
        FixedWindowRateLimiter limiter = limiter(1, Duration.ofSeconds(60));
        assertTrue(limiter.tryAcquire("a").allowed());
        assertFalse(limiter.tryAcquire("a").allowed());

        now = seconds(60);

        assertTrue(limiter.tryAcquire("a").allowed());
        assertFalse(limiter.tryAcquire("a").allowed());
    }

    @Test
    void rejectedRequestsDoNotExtendTheWindow() {
        FixedWindowRateLimiter limiter = limiter(1, Duration.ofSeconds(60));
        limiter.tryAcquire("a");
        now = seconds(30);
        limiter.tryAcquire("a");
        now = seconds(61);

        assertTrue(limiter.tryAcquire("a").allowed());
    }

    @Test
    void invalidSettingsAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> limiter(0, Duration.ofSeconds(60)));
        assertThrows(IllegalArgumentException.class, () -> limiter(1, Duration.ZERO));
    }
}
