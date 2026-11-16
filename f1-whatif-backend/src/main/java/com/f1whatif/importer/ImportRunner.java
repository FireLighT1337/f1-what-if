package com.f1whatif.importer;

import com.f1whatif.importer.JolpicaResponse.RaceDto;
import com.f1whatif.repository.RaceRepository;
import java.time.Year;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Runs only with the "import" profile. Imports the configured seasons from Jolpica
 * and then shuts the application down.
 *
 * Settings (all optional): app.import.from (default 1961), app.import.to (default: this year),
 * app.import.skip-existing (default false), app.import.delay-ms (default 1000).
 */
@Component
@Profile("import")
public class ImportRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ImportRunner.class);
    private static final int FIRST_SPRINT_SEASON = 2021;

    private final JolpicaClient client;
    private final SeasonImporter importer;
    private final RaceRepository races;
    private final ApplicationContext context;
    private final int fromYear;
    private final int toYear;
    private final boolean skipExisting;

    public ImportRunner(JolpicaClient client, SeasonImporter importer, RaceRepository races,
                        ApplicationContext context,
                        @Value("${app.import.from:1961}") int fromYear,
                        @Value("${app.import.to:0}") int toYear,
                        @Value("${app.import.skip-existing:false}") boolean skipExisting) {
        this.client = client;
        this.importer = importer;
        this.races = races;
        this.context = context;
        this.fromYear = fromYear;
        this.toYear = toYear == 0 ? Year.now().getValue() : toYear;
        this.skipExisting = skipExisting;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean failed = false;
        log.info("Importing seasons {} to {} (skip existing: {})", fromYear, toYear, skipExisting);
        try {
            for (int year = fromYear; year <= toYear; year++) {
                importYear(year);
            }
            log.info("Import finished after {} requests", client.requestCount());
        } catch (RuntimeException e) {
            failed = true;
            log.error("Import stopped. Seasons imported before the failure are kept; "
                    + "run again with app.import.skip-existing=true to continue.", e);
        }
        final int exitCode = failed ? 1 : 0;
        System.exit(SpringApplication.exit(context, () -> exitCode));
    }

    private void importYear(int year) {
        if (skipExisting && races.existsBySeason_Year(year)) {
            log.info("{}: already imported, skipped", year);
            return;
        }
        List<RaceDto> raceRows = client.fetchRaces(year, "results");
        if (raceRows.isEmpty()) {
            log.info("{}: no results available, skipped", year);
            return;
        }
        List<RaceDto> sprintRows = year >= FIRST_SPRINT_SEASON ? client.fetchRaces(year, "sprint") : List.of();
        int stored = importer.importSeason(year, raceRows, sprintRows);
        log.info("{}: {} races, {} results stored ({} requests so far)",
                year, raceRows.size(), stored, client.requestCount());
    }
}
