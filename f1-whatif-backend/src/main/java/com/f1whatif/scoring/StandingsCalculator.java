package com.f1whatif.scoring;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/**
 * Calculates driver standings from raw results under a given points system.
 * Pure Java: no Spring, no database, so it is fast to unit test.
 */
public final class StandingsCalculator {

    private static final int COUNTBACK_DEPTH = 30;

    /** Standings for a season in which every race ran its full distance. */
    public List<StandingRow> driverStandings(
            List<ResultEntry> results, ScoringRules rules, ScoringOptions options) {
        return driverStandings(results, rules, options, Map.of());
    }

    /**
     * @param distances race id -> distance, only for races that ended early; races
     *                  that are
     *                  not in the map are treated as having run their full distance
     */
    public List<StandingRow> driverStandings(
            List<ResultEntry> results, ScoringRules rules, ScoringOptions options,
            Map<Long, RaceDistance> distances) {
        return driverStandings(results, rules, options, distances, Map.of());
    }

    /**
     * @param roundMultipliers round -> factor applied to the race points of that
     *                         round (not to sprints),
     *                         for example 2.0 for a double-points finale
     */
    public List<StandingRow> driverStandings(
            List<ResultEntry> results, ScoringRules rules, ScoringOptions options,
            Map<Long, RaceDistance> distances, Map<Integer, Double> roundMultipliers) {

        List<ResultEntry> prepared = prepare(results, options);

        Map<Long, DriverTally> tallies = new HashMap<>();
        for (ResultEntry entry : prepared) {
            RaceAdjustment adjustment = entry.sprint()
                    ? RaceAdjustment.FULL
                    : rules.shortenedPolicy().adjustmentFor(distances.get(entry.raceId()));
            tallies.computeIfAbsent(entry.driverId(), DriverTally::new)
                    .add(entry, pointsFor(entry, rules, adjustment, roundMultipliers));
        }

        Map<Long, Double> totals = new HashMap<>();
        for (DriverTally tally : tallies.values()) {
            totals.put(tally.driverId, options.counting().total(tally.pointsByRound));
        }

        List<DriverTally> sorted = new ArrayList<>(tallies.values());
        sorted.sort((a, b) -> {
            int byPoints = Double.compare(totals.get(b.driverId), totals.get(a.driverId));
            return byPoints != 0 ? byPoints : compareByCountback(a.finishes, a.driverId, b.finishes, b.driverId);
        });

        List<StandingRow> rows = new ArrayList<>();
        int rank = 1;
        for (DriverTally tally : sorted) {
            rows.add(new StandingRow(rank++, tally.driverId, totals.get(tally.driverId)));
        }
        return rows;
    }

    /**
     * Ranks drivers by points that are given rather than calculated, for example
     * the points that were
     * really awarded, and breaks ties exactly like {@link #driverStandings}. This
     * keeps the real standings
     * and a what-if calculation comparable: without it, drivers on equal points
     * could appear to swap
     * places only because the two rankings split the tie differently.
     */
    public List<StandingRow> rankByPoints(List<ResultEntry> results, Map<Long, Double> pointsByDriver) {
        Map<Long, int[]> finishesByDriver = new HashMap<>();
        for (ResultEntry entry : results) {
            Integer position = entry.position();
            if (!entry.sprint() && position != null && position >= 1 && position <= COUNTBACK_DEPTH
                    && pointsByDriver.containsKey(entry.driverId())) {
                finishesByDriver.computeIfAbsent(entry.driverId(), id -> new int[COUNTBACK_DEPTH + 1])[position]++;
            }
        }

        int[] none = new int[COUNTBACK_DEPTH + 1];
        List<Long> drivers = new ArrayList<>(pointsByDriver.keySet());
        drivers.sort((a, b) -> {
            int byPoints = Double.compare(pointsByDriver.get(b), pointsByDriver.get(a));
            return byPoints != 0
                    ? byPoints
                    : compareByCountback(finishesByDriver.getOrDefault(a, none), a,
                            finishesByDriver.getOrDefault(b, none), b);
        });

        List<StandingRow> rows = new ArrayList<>();
        int rank = 1;
        for (Long driverId : drivers) {
            rows.add(new StandingRow(rank++, driverId, pointsByDriver.get(driverId)));
        }
        return rows;
    }

    /**
     * How one driver scored in every round under a scenario, and where that leaves
     * them.
     *
     * @return null when the driver does not appear in the scenario (excluded, or no
     *         results left)
     */
    public DriverBreakdown driverBreakdown(
            List<ResultEntry> results, ScoringRules rules, ScoringOptions options,
            Map<Long, RaceDistance> distances, long driverId) {
        return driverBreakdown(results, rules, options, distances, Map.of(), driverId);
    }

    public DriverBreakdown driverBreakdown(
            List<ResultEntry> results, ScoringRules rules, ScoringOptions options,
            Map<Long, RaceDistance> distances, Map<Integer, Double> roundMultipliers, long driverId) {

        StandingRow standing = driverStandings(results, rules, options, distances, roundMultipliers).stream()
                .filter(row -> row.driverId() == driverId)
                .findFirst()
                .orElse(null);
        if (standing == null) {
            return null;
        }

        record Parts(Integer racePosition, double racePoints, boolean hasRace,
                Integer sprintPosition, double sprintPoints, boolean hasSprint) {
        }
        Map<Integer, Parts> byRound = new TreeMap<>();
        for (ResultEntry entry : prepare(results, options)) {
            if (entry.driverId() != driverId) {
                continue;
            }
            RaceAdjustment adjustment = entry.sprint()
                    ? RaceAdjustment.FULL
                    : rules.shortenedPolicy().adjustmentFor(distances.get(entry.raceId()));
            double points = pointsFor(entry, rules, adjustment, roundMultipliers);
            Parts current = byRound.getOrDefault(entry.round(), new Parts(null, 0, false, null, 0, false));
            byRound.put(entry.round(), entry.sprint()
                    ? new Parts(current.racePosition(), current.racePoints(), current.hasRace(), entry.position(),
                            points, true)
                    : new Parts(entry.position(), points, true, current.sprintPosition(), current.sprintPoints(),
                            current.hasSprint()));
        }

        Map<Integer, Double> pointsByRound = new TreeMap<>();
        byRound.forEach((round, parts) -> pointsByRound.put(round, parts.racePoints() + parts.sprintPoints()));
        Set<Integer> counted = options.counting().countedRounds(pointsByRound);

        List<RoundBreakdown> rounds = new ArrayList<>();
        for (Map.Entry<Integer, Parts> entry : byRound.entrySet()) {
            Parts parts = entry.getValue();
            rounds.add(new RoundBreakdown(entry.getKey(), parts.hasRace(), parts.racePosition(), parts.racePoints(),
                    parts.hasSprint(), parts.sprintPosition(), parts.sprintPoints(), counted.contains(entry.getKey())));
        }
        return new DriverBreakdown(standing.rank(), standing.points(), rounds);
    }

    /**
     * Countback: most wins, then most second places, and so on; the driver id only
     * settles exact ties.
     */
    private static int compareByCountback(int[] finishesA, long idA, int[] finishesB, long idB) {
        for (int p = 1; p <= COUNTBACK_DEPTH; p++) {
            int byCount = Integer.compare(finishesB[p], finishesA[p]);
            if (byCount != 0) {
                return byCount;
            }
        }
        return Long.compare(idA, idB);
    }

    /** Applies race, sprint and driver exclusions. */
    private static List<ResultEntry> prepare(List<ResultEntry> results, ScoringOptions options) {
        List<ResultEntry> kept = new ArrayList<>();
        for (ResultEntry entry : results) {
            boolean raceExcluded = options.excludedRaceIds().contains(entry.raceId());
            boolean sprintExcluded = entry.sprint() && !options.includeSprints();
            if (!raceExcluded && !sprintExcluded) {
                kept.add(entry);
            }
        }
        return removeExcludedDrivers(kept, options.excludedDriverIds());
    }

    /**
     * Removes excluded drivers and moves everyone behind them up, so "what if
     * driver X
     * had never raced" gives the others the positions they would have taken.
     */
    private static List<ResultEntry> removeExcludedDrivers(List<ResultEntry> entries, Set<Long> excluded) {
        if (excluded.isEmpty()) {
            return entries;
        }
        Map<SessionKey, List<ResultEntry>> sessions = new LinkedHashMap<>();
        for (ResultEntry entry : entries) {
            sessions.computeIfAbsent(new SessionKey(entry.raceId(), entry.sprint()), k -> new ArrayList<>())
                    .add(entry);
        }

        List<ResultEntry> out = new ArrayList<>();
        for (List<ResultEntry> session : sessions.values()) {
            List<ResultEntry> remaining = session.stream()
                    .filter(e -> !excluded.contains(e.driverId()))
                    .toList();
            List<ResultEntry> classified = remaining.stream()
                    .filter(e -> e.position() != null)
                    .sorted(Comparator.comparingInt(ResultEntry::position))
                    .toList();
            int next = 1;
            for (ResultEntry entry : classified) {
                out.add(entry.withPosition(next++));
            }
            remaining.stream().filter(e -> e.position() == null).forEach(out::add);
        }
        return out;
    }

    private static double pointsFor(ResultEntry entry, ScoringRules rules, RaceAdjustment adjustment,
            Map<Integer, Double> roundMultipliers) {
        if (entry.position() == null) {
            return 0.0;
        }
        double points;
        if (entry.sprint()) {
            points = rules.sprintPoints().getOrDefault(entry.position(), 0.0);
        } else {
            Map<Integer, Double> table = adjustment.replacementPoints() != null
                    ? adjustment.replacementPoints()
                    : rules.racePoints();
            points = table.getOrDefault(entry.position(), 0.0) * adjustment.factor();
        }
        double multiplier = entry.sprint() ? 1.0 : roundMultipliers.getOrDefault(entry.round(), 1.0);

        boolean fastestLapBonus = !entry.sprint()
                && entry.fastestLap()
                && adjustment.fastestLapAllowed()
                && rules.fastestLapPoint() > 0
                && (!rules.fastestLapRequiresTopTen() || entry.position() <= 10);
        if (fastestLapBonus) {
            points += rules.fastestLapPoint();
        }
        return points * multiplier;
    }

    private record SessionKey(long raceId, boolean sprint) {
    }

    private static final class DriverTally {
        final long driverId;
        /** Points per round; a race and its sprint count together as one round. */
        final Map<Integer, Double> pointsByRound = new TreeMap<>();
        /**
         * finishes[p] = number of times the driver finished in position p in a race.
         */
        final int[] finishes = new int[COUNTBACK_DEPTH + 1];

        DriverTally(long driverId) {
            this.driverId = driverId;
        }

        void add(ResultEntry entry, double points) {
            pointsByRound.merge(entry.round(), points, Double::sum);
            Integer position = entry.position();
            if (!entry.sprint() && position != null && position >= 1 && position <= COUNTBACK_DEPTH) {
                finishes[position]++;
            }
        }
    }
}
