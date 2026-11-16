package com.f1whatif.importer;

import com.f1whatif.importer.JolpicaResponse.MrData;
import com.f1whatif.importer.JolpicaResponse.RaceDto;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * Reads season data from the Jolpica API (the Ergast successor).
 *
 * Jolpica's documented limits are 4 requests per second and 500 per hour, and it asks
 * clients to send a user agent of the form "AppName/version". Every request is delayed,
 * the hourly budget is tracked, and rate-limit (429) or server errors are retried with a
 * growing pause.
 */
@Component
@Profile("import")
public class JolpicaClient {

    private static final Logger log = LoggerFactory.getLogger(JolpicaClient.class);
    private static final String USER_AGENT = "F1WhatIfImporter/0.0.1";
    private static final int PAGE_SIZE = 100;   // Jolpica's maximum
    private static final int MAX_ATTEMPTS = 5;

    private final RestClient http;
    private final long delayMs;
    private final RequestBudget budget;
    private int requestCount;

    public JolpicaClient(
            @Value("${app.import.base-url:https://api.jolpi.ca/ergast/f1}") String baseUrl,
            @Value("${app.import.delay-ms:1000}") long delayMs,
            @Value("${app.import.max-requests-per-hour:450}") int maxRequestsPerHour) {
        this.http = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.USER_AGENT, USER_AGENT)
                .build();
        this.delayMs = delayMs;
        this.budget = new RequestBudget(maxRequestsPerHour);
    }

    /**
     * Fetches every race of a season for one resource, either "results" or "sprint",
     * following pagination and merging races that were split across pages.
     */
    public List<RaceDto> fetchRaces(int season, String resource) {
        List<RaceDto> collected = new ArrayList<>();
        int offset = 0;
        while (true) {
            MrData data = get(season, resource, offset);
            List<RaceDto> page = data.races();
            collected.addAll(page);

            Integer total = ImportMapping.parseInt(data.total());
            Integer servedLimit = ImportMapping.parseInt(data.limit());
            offset += Math.max(servedLimit == null ? PAGE_SIZE : servedLimit, 1);
            if (page.isEmpty() || total == null || offset >= total) {
                break;
            }
        }
        return RaceMerger.mergeByRound(collected);
    }

    public int requestCount() {
        return requestCount;
    }

    private MrData get(int season, String resource, int offset) {
        for (int attempt = 1; ; attempt++) {
            pause(delayMs);
            waitForHourlyBudget();
            requestCount++;
            try {
                JolpicaResponse response = http.get()
                        .uri("/{season}/{resource}.json?limit={limit}&offset={offset}",
                                season, resource, PAGE_SIZE, offset)
                        .retrieve()
                        .body(JolpicaResponse.class);
                if (response == null || response.mrData() == null) {
                    throw new IllegalStateException("Empty response for " + season + "/" + resource);
                }
                return response.mrData();
            } catch (RestClientResponseException e) {
                int status = e.getStatusCode().value();
                boolean retryable = status == 429 || status >= 500;
                if (!retryable || attempt >= MAX_ATTEMPTS) {
                    throw e;
                }
                long waitMs = 30_000L * attempt;
                log.warn("Jolpica answered {} for {}/{} (attempt {}/{}), waiting {} s",
                        status, season, resource, attempt, MAX_ATTEMPTS, waitMs / 1000);
                pause(waitMs);
            }
        }
    }

    private void waitForHourlyBudget() {
        long waitMs = budget.millisToWait(System.currentTimeMillis());
        if (waitMs > 0) {
            log.info("Hourly request budget used up, waiting {} minutes", waitMs / 60_000 + 1);
            pause(waitMs);
        }
        budget.record(System.currentTimeMillis());
    }

    private static void pause(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Import interrupted", e);
        }
    }
}
