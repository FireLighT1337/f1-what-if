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
     * @param distances race id -> distance, only for races that ended early; races that are
     *                  not in the map are treated as having run their full distance
     */
    public List<StandingRow> driverStandings(
            List<ResultEntry> results, ScoringRules rules, ScoringOptions options,
            Map<Long, RaceDistance> distances) {

        List<ResultEntry> prepared = prepare(results, options);

        Map<Long, DriverTally> tallies = new HashMap<>();
        for (ResultEntry entry : prepared) {
            RaceAdjustment adjustment = entry.sprint()
                    ? RaceAdjustment.FULL
                    : rules.shortenedPolicy().adjustmentFor(distances.get(entry.raceId()));
            tallies.computeIfAbsent(entry.driverId(), DriverTally::new)
                    .add(entry, pointsFor(entry, rules, adjustment));
        }

        Map<Long, Double> totals = new HashMap<>();
        for (DriverTally tally : tallies.values()) {
            totals.put(tally.driverId, tally.total(options.countBest()));
        }

        List<DriverTally> sorted = new ArrayList<>(tallies.values());
        sorted.sort((a, b) -> {
            int byPoints = Double.compare(totals.get(b.driverId), totals.get(a.driverId));
            if (byPoints != 0) {
                return byPoints;
            }
            // Countback: most wins, then most second places, and so on.
            for (int p = 1; p <= COUNTBACK_DEPTH; p++) {
                int byCount = Integer.compare(b.finishes[p], a.finishes[p]);
                if (byCount != 0) {
                    return byCount;
                }
            }
            return Long.compare(a.driverId, b.driverId);
        });

        List<StandingRow> rows = new ArrayList<>();
        int rank = 1;
        for (DriverTally tally : sorted) {
            rows.add(new StandingRow(rank++, tally.driverId, totals.get(tally.driverId)));
        }
        return rows;
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
     * Removes excluded drivers and moves everyone behind them up, so "what if driver X
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

    private static double pointsFor(ResultEntry entry, ScoringRules rules, RaceAdjustment adjustment) {
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

        boolean fastestLapBonus = !entry.sprint()
                && entry.fastestLap()
                && adjustment.fastestLapAllowed()
                && rules.fastestLapPoint() > 0
                && (!rules.fastestLapRequiresTopTen() || entry.position() <= 10);
        if (fastestLapBonus) {
            points += rules.fastestLapPoint();
        }
        return points;
    }

    private record SessionKey(long raceId, boolean sprint) {
    }

    private static final class DriverTally {
        final long driverId;
        /** Points per round; a race and its sprint count together as one round. */
        final Map<Integer, Double> pointsByRound = new TreeMap<>();
        /** finishes[p] = number of times the driver finished in position p in a race. */
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

        double total(Integer countBest) {
            List<Double> values = new ArrayList<>(pointsByRound.values());
            if (countBest != null) {
                values.sort(Comparator.reverseOrder());
                values = values.subList(0, Math.min(countBest, values.size()));
            }
            double sum = 0;
            for (double value : values) {
                sum += value;
            }
            return sum;
        }
    }
}
