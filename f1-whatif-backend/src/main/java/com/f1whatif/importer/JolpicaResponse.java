package com.f1whatif.importer;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

/**
 * Shape of the Ergast-compatible JSON that Jolpica returns. Only the fields the importer
 * needs are mapped. Jolpica sends numbers as strings, so most fields are Strings.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record JolpicaResponse(@JsonProperty("MRData") MrData mrData) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MrData(
            String limit,
            String offset,
            String total,
            @JsonProperty("RaceTable") RaceTable raceTable) {

        public List<RaceDto> races() {
            return raceTable == null || raceTable.races() == null ? List.of() : raceTable.races();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RaceTable(@JsonProperty("Races") List<RaceDto> races) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RaceDto(
            String season,
            String round,
            String raceName,
            String date,
            @JsonProperty("Circuit") CircuitDto circuit,
            @JsonProperty("Results") List<ResultDto> results,
            @JsonProperty("SprintResults") List<ResultDto> sprintResults) {

        public List<ResultDto> resultsOrEmpty() {
            return results == null ? List.of() : results;
        }

        public List<ResultDto> sprintResultsOrEmpty() {
            return sprintResults == null ? List.of() : sprintResults;
        }

        /** Combines two partial copies of the same race (a race can be split across pages). */
        public RaceDto withResultsFrom(RaceDto other) {
            return new RaceDto(season, round, raceName, date, circuit,
                    concat(resultsOrEmpty(), other.resultsOrEmpty()),
                    concat(sprintResultsOrEmpty(), other.sprintResultsOrEmpty()));
        }

        private static List<ResultDto> concat(List<ResultDto> a, List<ResultDto> b) {
            List<ResultDto> out = new ArrayList<>(a);
            out.addAll(b);
            return out;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CircuitDto(
            String circuitId,
            String circuitName,
            @JsonProperty("Location") LocationDto location) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LocationDto(String locality, String country) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ResultDto(
            String position,
            String positionText,
            String points,
            String grid,
            String status,
            @JsonProperty("Driver") DriverDto driver,
            @JsonProperty("Constructor") ConstructorDto constructor,
            @JsonProperty("FastestLap") FastestLapDto fastestLap) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DriverDto(
            String driverId,
            String code,
            String givenName,
            String familyName,
            String dateOfBirth,
            String nationality,
            String url) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ConstructorDto(String constructorId, String name, String nationality) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FastestLapDto(String rank) {
    }
}
