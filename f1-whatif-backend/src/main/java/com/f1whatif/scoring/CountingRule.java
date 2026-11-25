package com.f1whatif.scoring;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Which of a driver's round totals count towards the championship.
 * Round totals are race plus sprint points of one round.
 */
public sealed interface CountingRule permits CountingRule.All, CountingRule.Best, CountingRule.Split {

    /** Every round counts (1991 onward). */
    CountingRule ALL = new All();

    static CountingRule best(int n) {
        return new Best(n);
    }

    /**
     * Best results of the first part of the season plus best results of the second part.
     *
     * @param firstPartRounds rounds 1..firstPartRounds form the first part, all later rounds the second
     */
    static CountingRule split(int firstPartRounds, int bestFirst, int bestSecond) {
        return new Split(firstPartRounds, bestFirst, bestSecond);
    }

    /** The rounds whose points count. */
    Set<Integer> countedRounds(Map<Integer, Double> pointsByRound);

    default double total(Map<Integer, Double> pointsByRound) {
        double sum = 0;
        for (int round : countedRounds(pointsByRound)) {
            sum += pointsByRound.get(round);
        }
        return sum;
    }

    /** The n rounds with the most points; equal points are settled by the earlier round. */
    private static Set<Integer> bestRounds(Map<Integer, Double> pointsByRound, int n) {
        List<Map.Entry<Integer, Double>> entries = new ArrayList<>(pointsByRound.entrySet());
        entries.sort(Map.Entry.<Integer, Double>comparingByValue(Comparator.reverseOrder())
                .thenComparing(Map.Entry.comparingByKey()));
        Set<Integer> counted = new HashSet<>();
        for (int i = 0; i < Math.min(n, entries.size()); i++) {
            counted.add(entries.get(i).getKey());
        }
        return counted;
    }

    record All() implements CountingRule {
        @Override
        public Set<Integer> countedRounds(Map<Integer, Double> pointsByRound) {
            return new HashSet<>(pointsByRound.keySet());
        }
    }

    record Best(int n) implements CountingRule {
        public Best {
            if (n < 1) {
                throw new IllegalArgumentException("n must be at least 1");
            }
        }

        @Override
        public Set<Integer> countedRounds(Map<Integer, Double> pointsByRound) {
            return CountingRule.bestRounds(pointsByRound, n);
        }
    }

    record Split(int firstPartRounds, int bestFirst, int bestSecond) implements CountingRule {
        public Split {
            if (firstPartRounds < 1 || bestFirst < 1 || bestSecond < 1) {
                throw new IllegalArgumentException("split rule values must be at least 1");
            }
        }

        @Override
        public Set<Integer> countedRounds(Map<Integer, Double> pointsByRound) {
            Map<Integer, Double> first = new java.util.TreeMap<>();
            Map<Integer, Double> second = new java.util.TreeMap<>();
            pointsByRound.forEach((round, points) -> (round <= firstPartRounds ? first : second).put(round, points));
            Set<Integer> counted = CountingRule.bestRounds(first, bestFirst);
            counted.addAll(CountingRule.bestRounds(second, bestSecond));
            return counted;
        }
    }
}
