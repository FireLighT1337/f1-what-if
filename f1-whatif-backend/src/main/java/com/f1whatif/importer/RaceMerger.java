package com.f1whatif.importer;

import com.f1whatif.importer.JolpicaResponse.RaceDto;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Jolpica paginates by result rows, not by races, so one race can appear on two
 * consecutive pages with only some of its results each. This merges them by round.
 */
final class RaceMerger {

    private RaceMerger() {
    }

    static List<RaceDto> mergeByRound(List<RaceDto> races) {
        Map<String, RaceDto> byRound = new LinkedHashMap<>();
        for (RaceDto race : races) {
            byRound.merge(race.round(), race, RaceDto::withResultsFrom);
        }
        return new ArrayList<>(byRound.values());
    }
}
