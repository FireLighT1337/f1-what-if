package com.f1whatif.importer;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.f1whatif.importer.JolpicaResponse.RaceDto;
import com.f1whatif.importer.JolpicaResponse.ResultDto;
import java.util.List;
import org.junit.jupiter.api.Test;

class RaceMergerTest {

    private static ResultDto result(String position) {
        return new ResultDto(position, position, "0", "1", "Finished", null, null, null);
    }

    private static RaceDto race(String round, ResultDto... results) {
        return new RaceDto("2024", round, "Race " + round, "2024-03-02", null, List.of(results), null);
    }

    @Test
    void sameRoundOnTwoPagesIsMergedIntoOneRace() {
        List<RaceDto> merged = RaceMerger.mergeByRound(List.of(
                race("1", result("1"), result("2")),
                race("1", result("3")),
                race("2", result("1"))));

        assertEquals(2, merged.size());
        assertEquals("1", merged.get(0).round());
        assertEquals(3, merged.get(0).resultsOrEmpty().size());
        assertEquals(1, merged.get(1).resultsOrEmpty().size());
    }

    @Test
    void emptyInputGivesEmptyOutput() {
        assertEquals(0, RaceMerger.mergeByRound(List.of()).size());
    }
}
