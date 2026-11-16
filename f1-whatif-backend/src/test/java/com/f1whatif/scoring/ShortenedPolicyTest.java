package com.f1whatif.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class ShortenedPolicyTest {

    @Test
    void raceWithoutDistanceDataIsScoredInFull() {
        assertEquals(RaceAdjustment.FULL, ShortenedPolicy.HALF_1980.adjustmentFor(null));
        assertEquals(RaceAdjustment.FULL, ShortenedPolicy.TIERED_2022.adjustmentFor(null));
    }

    @Test
    void nonePolicyIgnoresShortenedRaces() {
        assertEquals(RaceAdjustment.FULL, ShortenedPolicy.NONE.adjustmentFor(new RaceDistance(81, 14, 14)));
    }

    @Test
    void halfPolicyNeedsTwoLapsThenPaysHalfBelowThreeQuarters() {
        RaceAdjustment oneLap = ShortenedPolicy.HALF_1980.adjustmentFor(new RaceDistance(44, 1, 1));
        RaceAdjustment twoLaps = ShortenedPolicy.HALF_1980.adjustmentFor(new RaceDistance(44, 2, 0));
        RaceAdjustment justShort = ShortenedPolicy.HALF_1980.adjustmentFor(new RaceDistance(100, 74, 74));
        RaceAdjustment threeQuarters = ShortenedPolicy.HALF_1980.adjustmentFor(new RaceDistance(100, 75, 75));

        assertEquals(RaceAdjustment.NO_POINTS, oneLap);
        assertEquals(0.5, twoLaps.factor(), 0.0001);
        assertEquals(0.5, justShort.factor(), 0.0001);
        assertEquals(false, justShort.fastestLapAllowed());
        assertEquals(RaceAdjustment.FULL, threeQuarters);
    }

    @Test
    void tieredPolicyUsesTheTableForTheDistanceCompleted() {
        RaceAdjustment under25 = ShortenedPolicy.TIERED_2022.adjustmentFor(new RaceDistance(100, 10, 10));
        RaceAdjustment under50 = ShortenedPolicy.TIERED_2022.adjustmentFor(new RaceDistance(100, 30, 30));
        RaceAdjustment under75 = ShortenedPolicy.TIERED_2022.adjustmentFor(new RaceDistance(100, 60, 60));
        RaceAdjustment full = ShortenedPolicy.TIERED_2022.adjustmentFor(new RaceDistance(100, 80, 80));

        assertEquals(6.0, under25.replacementPoints().get(1), 0.0001);
        assertEquals(1.0, under25.replacementPoints().get(5), 0.0001);
        assertEquals(null, under25.replacementPoints().get(6));
        assertEquals(13.0, under50.replacementPoints().get(1), 0.0001);
        assertEquals(1.0, under50.replacementPoints().get(9), 0.0001);
        assertEquals(19.0, under75.replacementPoints().get(1), 0.0001);
        assertEquals(1.0, under75.replacementPoints().get(10), 0.0001);
        assertEquals(RaceAdjustment.FULL, full);
    }

    @Test
    void tieredPolicyAwardsTheFastestLapPointOnlyFromHalfDistance() {
        assertEquals(false, ShortenedPolicy.TIERED_2022.adjustmentFor(new RaceDistance(100, 49, 49)).fastestLapAllowed());
        assertTrue(ShortenedPolicy.TIERED_2022.adjustmentFor(new RaceDistance(100, 50, 50)).fastestLapAllowed());
    }

    @Test
    void tieredPolicyCountsOnlyRacingLapsForTheTwoLapMinimum() {
        // Like the 2021 Belgian GP: two laps behind the safety car, none in racing conditions.
        RaceDistance belgium2021 = new RaceDistance(44, 2, 0);

        assertEquals(0.5, ShortenedPolicy.HALF_1980.adjustmentFor(belgium2021).factor(), 0.0001);
        assertEquals(RaceAdjustment.NO_POINTS, ShortenedPolicy.TIERED_2022.adjustmentFor(belgium2021));
    }

    @Test
    void impossibleDistancesAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> new RaceDistance(0, 0, 0));
        assertThrows(IllegalArgumentException.class, () -> new RaceDistance(10, 11, 5));
        assertThrows(IllegalArgumentException.class, () -> new RaceDistance(10, 5, 6));
    }
}
