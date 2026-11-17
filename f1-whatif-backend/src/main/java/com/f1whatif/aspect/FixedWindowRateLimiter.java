package com.f1whatif.aspect;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.LongSupplier;

/**
 * Counts requests per key in fixed time windows: the first request starts a window, and
 * once maxRequests have been made in it, further requests are rejected until it ends.
 * Plain Java with an injectable clock, so it can be tested without waiting.
 */
final class FixedWindowRateLimiter {

    /** Upper bound on remembered keys, so memory use stays bounded. */
    private static final int MAX_TRACKED_KEYS = 100_000;
    private static final int SWEEP_EVERY_CALLS = 1_000;

    record Decision(boolean allowed, long retryAfterSeconds) {
        static final Decision ALLOWED = new Decision(true, 0);
    }

    private record Window(long startNanos, int count) {
    }

    private final int maxRequests;
    private final long windowNanos;
    private final LongSupplier clockNanos;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final AtomicLong calls = new AtomicLong();

    FixedWindowRateLimiter(int maxRequests, Duration window, LongSupplier clockNanos) {
        if (maxRequests < 1) {
            throw new IllegalArgumentException("maxRequests must be at least 1");
        }
        if (window.isZero() || window.isNegative()) {
            throw new IllegalArgumentException("window must be positive");
        }
        this.maxRequests = maxRequests;
        this.windowNanos = window.toNanos();
        this.clockNanos = clockNanos;
    }

    Decision tryAcquire(String key) {
        long now = clockNanos.getAsLong();
        if (calls.incrementAndGet() % SWEEP_EVERY_CALLS == 0 || windows.size() > MAX_TRACKED_KEYS) {
            sweep(now);
        }

        Decision[] result = new Decision[1];
        windows.compute(key, (k, current) -> {
            Window window = current == null || now - current.startNanos() >= windowNanos
                    ? new Window(now, 0)
                    : current;
            if (window.count() < maxRequests) {
                result[0] = Decision.ALLOWED;
                return new Window(window.startNanos(), window.count() + 1);
            }
            long remainingNanos = windowNanos - (now - window.startNanos());
            long retryAfterSeconds = Math.max(1, (remainingNanos + 999_999_999L) / 1_000_000_000L);
            result[0] = new Decision(false, retryAfterSeconds);
            return window;
        });
        return result[0];
    }

    private void sweep(long now) {
        windows.values().removeIf(window -> now - window.startNanos() >= windowNanos);
        if (windows.size() > MAX_TRACKED_KEYS) {
            windows.clear();
        }
    }
}
