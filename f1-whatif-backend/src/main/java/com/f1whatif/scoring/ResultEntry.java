package com.f1whatif.scoring;

/**
 * One driver's result in one session (race or sprint). Plain data, no JPA or Spring.
 *
 * @param position finishing position, or null if not classified
 */
public record ResultEntry(
        long raceId,
        int round,
        long driverId,
        Integer position,
        boolean fastestLap,
        boolean sprint) {

    public ResultEntry withPosition(Integer newPosition) {
        return new ResultEntry(raceId, round, driverId, newPosition, fastestLap, sprint);
    }
}
