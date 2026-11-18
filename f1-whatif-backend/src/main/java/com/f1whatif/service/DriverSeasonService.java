package com.f1whatif.service;

import com.f1whatif.dto.DriverProfile;
import com.f1whatif.dto.DriverRaceResult;
import com.f1whatif.dto.DriverSeasonResponse;
import com.f1whatif.dto.DriverSeasonSummary;
import com.f1whatif.dto.SprintResultInfo;
import com.f1whatif.entity.Driver;
import com.f1whatif.entity.Race;
import com.f1whatif.entity.RaceResult;
import com.f1whatif.entity.SessionType;
import com.f1whatif.entity.ShortenedRace;
import com.f1whatif.repository.DriverRepository;
import com.f1whatif.repository.DriverResultQueryRepository;
import com.f1whatif.repository.ReferenceQueryRepository;
import com.f1whatif.repository.ShortenedRaceRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** How one driver finished every race of one season. */
@Service
public class DriverSeasonService {

    private final DriverRepository drivers;
    private final DriverResultQueryRepository driverResults;
    private final ReferenceQueryRepository reference;
    private final ShortenedRaceRepository shortenedRaces;

    public DriverSeasonService(DriverRepository drivers, DriverResultQueryRepository driverResults,
                               ReferenceQueryRepository reference, ShortenedRaceRepository shortenedRaces) {
        this.drivers = drivers;
        this.driverResults = driverResults;
        this.reference = reference;
        this.shortenedRaces = shortenedRaces;
    }

    @Cacheable(cacheNames = "reference", key = "'driverSeason:' + #year + ':' + #driverId")
    @Transactional(readOnly = true)
    public DriverSeasonResponse driverSeason(int year, long driverId) {
        Driver driver = drivers.findById(driverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
        List<RaceResult> results = driverResults.findDriverSeasonResults(year, driverId);
        if (results.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    driver.getFullName() + " did not take part in the " + year + " season");
        }

        Map<Integer, RaceResult> raceByRound = new HashMap<>();
        Map<Integer, RaceResult> sprintByRound = new HashMap<>();
        for (RaceResult result : results) {
            int round = result.getRace().getRound();
            if (result.getSessionType() == SessionType.SPRINT) {
                sprintByRound.put(round, result);
            } else {
                raceByRound.put(round, result);
            }
        }

        Set<Integer> shortenedRounds = new HashSet<>();
        for (ShortenedRace shortened : shortenedRaces.findBySeasonYear(year)) {
            shortenedRounds.add(shortened.getRound());
        }

        List<DriverRaceResult> rows = new ArrayList<>();
        for (Race race : reference.findRacesWithCircuit(year)) {
            rows.add(toRow(race, raceByRound.get(race.getRound()), sprintByRound.get(race.getRound()),
                    shortenedRounds.contains(race.getRound())));
        }

        return new DriverSeasonResponse(toProfile(driver), year, summarize(raceByRound, sprintByRound), rows);
    }

    private static DriverRaceResult toRow(Race race, RaceResult main, RaceResult sprint, boolean shortened) {
        RaceResult any = main != null ? main : sprint;
        if (any == null) {
            return new DriverRaceResult(race.getRound(), race.getName(), race.getRaceDate(), shortened, false,
                    null, null, null, null, null, null, null);
        }
        SprintResultInfo sprintInfo = sprint == null ? null : new SprintResultInfo(
                sprint.getGridPosition(), sprint.getFinishPosition(), sprint.getPositionText(),
                sprint.getActualPoints());
        if (main == null) {
            // Only a sprint result exists for this weekend (the driver did not start the race).
            return new DriverRaceResult(race.getRound(), race.getName(), race.getRaceDate(), shortened, true,
                    sprint.getTeam().getName(), null, null, null, null, null, sprintInfo);
        }
        return new DriverRaceResult(race.getRound(), race.getName(), race.getRaceDate(), shortened, true,
                main.getTeam().getName(), main.getGridPosition(), main.getFinishPosition(), main.getPositionText(),
                main.getStatusText(), main.getActualPoints(), sprintInfo);
    }

    private static DriverSeasonSummary summarize(Map<Integer, RaceResult> raceByRound,
                                                 Map<Integer, RaceResult> sprintByRound) {
        int wins = 0;
        int podiums = 0;
        BigDecimal points = BigDecimal.ZERO;
        for (RaceResult race : raceByRound.values()) {
            Integer position = race.getFinishPosition();
            if (position != null && position == 1) {
                wins++;
            }
            if (position != null && position <= 3) {
                podiums++;
            }
            points = points.add(race.getActualPoints());
        }
        for (RaceResult sprint : sprintByRound.values()) {
            points = points.add(sprint.getActualPoints());
        }
        return new DriverSeasonSummary(raceByRound.size(), wins, podiums, points);
    }

    private static DriverProfile toProfile(Driver driver) {
        String wikipediaUrl = WikipediaPhotos.articleTitle(driver.getWikipediaUrl())
                .map(WikipediaPhotos::articleUrl)
                .orElse(null);
        return new DriverProfile(driver.getId(), driver.getFullName(), driver.getCode(), driver.getNationality(),
                driver.getDateOfBirth(), wikipediaUrl);
    }
}
