package com.f1whatif.importer;

import java.util.ArrayDeque;
import java.util.Deque;

/**
 * Keeps track of how many requests were sent in the last hour, because Jolpica
 * enforces a sustained limit per hour on top of its per-second burst limit.
 * Pure logic with the time passed in, so it is easy to test.
 */
final class RequestBudget {

    private static final long HOUR_MS = 3_600_000L;

    private final int maxPerHour;
    private final Deque<Long> sentAt = new ArrayDeque<>();

    RequestBudget(int maxPerHour) {
        if (maxPerHour < 1) {
            throw new IllegalArgumentException("maxPerHour must be at least 1");
        }
        this.maxPerHour = maxPerHour;
    }

    /** How long to wait before the next request is allowed; 0 if one can be sent now. */
    long millisToWait(long nowMs) {
        evictOlderThanOneHour(nowMs);
        if (sentAt.size() < maxPerHour) {
            return 0;
        }
        return HOUR_MS - (nowMs - sentAt.peekFirst());
    }

    void record(long nowMs) {
        sentAt.addLast(nowMs);
    }

    private void evictOlderThanOneHour(long nowMs) {
        while (!sentAt.isEmpty() && nowMs - sentAt.peekFirst() >= HOUR_MS) {
            sentAt.pollFirst();
        }
    }
}
