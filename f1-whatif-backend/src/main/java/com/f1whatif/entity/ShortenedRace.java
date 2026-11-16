package com.f1whatif.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A race that ended before its scheduled distance. Kept apart from {@link Race} because the
 * importer deletes and recreates races; this data is maintained by hand with Flyway migrations.
 */
@Entity
@Table(name = "shortened_race")
public class ShortenedRace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "season_year", nullable = false)
    private int seasonYear;

    @Column(name = "round_number", nullable = false)
    private int round;

    @Column(name = "scheduled_laps", nullable = false)
    private int scheduledLaps;

    /** Laps completed by the leader, including laps behind the safety car. */
    @Column(name = "completed_laps", nullable = false)
    private int completedLaps;

    /** Laps completed by the leader in racing conditions (no safety car). */
    @Column(name = "racing_laps", nullable = false)
    private int racingLaps;

    private String note;

    protected ShortenedRace() {
    }

    public ShortenedRace(int seasonYear, int round, int scheduledLaps, int completedLaps, int racingLaps,
                         String note) {
        this.seasonYear = seasonYear;
        this.round = round;
        this.scheduledLaps = scheduledLaps;
        this.completedLaps = completedLaps;
        this.racingLaps = racingLaps;
        this.note = note;
    }

    public Long getId() {
        return id;
    }

    public int getSeasonYear() {
        return seasonYear;
    }

    public int getRound() {
        return round;
    }

    public int getScheduledLaps() {
        return scheduledLaps;
    }

    public int getCompletedLaps() {
        return completedLaps;
    }

    public int getRacingLaps() {
        return racingLaps;
    }

    public String getNote() {
        return note;
    }

    @Override
    public String toString() {
        return "ShortenedRace{seasonYear=" + seasonYear + ", round=" + round
                + ", scheduledLaps=" + scheduledLaps + ", completedLaps=" + completedLaps
                + ", racingLaps=" + racingLaps + "}";
    }
}
