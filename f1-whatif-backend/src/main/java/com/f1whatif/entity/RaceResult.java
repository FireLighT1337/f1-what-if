package com.f1whatif.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "race_result")
public class RaceResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_id")
    private Race race;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id")
    private Team team;

    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false)
    private SessionType sessionType;

    @Column(name = "grid_position")
    private Integer gridPosition;

    /** Null when the driver was not classified. */
    @Column(name = "finish_position")
    private Integer finishPosition;

    @Column(name = "position_text")
    private String positionText;

    @Column(name = "status_text")
    private String statusText;

    /** 1 = fastest lap of the session, null when unknown or not applicable. */
    @Column(name = "fastest_lap_rank")
    private Integer fastestLapRank;

    /**
     * Points actually awarded at the time, used to compare with the what-if result.
     */
    @Column(name = "actual_points", nullable = false)
    private BigDecimal actualPoints = BigDecimal.ZERO;

    protected RaceResult() {
    }

    public RaceResult(Race race, Driver driver, Team team, SessionType sessionType, Integer gridPosition,
            Integer finishPosition, String positionText, String statusText,
            Integer fastestLapRank, BigDecimal actualPoints) {
        this.race = race;
        this.driver = driver;
        this.team = team;
        this.sessionType = sessionType;
        this.gridPosition = gridPosition;
        this.finishPosition = finishPosition;
        this.positionText = positionText;
        this.statusText = statusText;
        this.fastestLapRank = fastestLapRank;
        this.actualPoints = actualPoints;
    }

    public Long getId() {
        return id;
    }

    public Race getRace() {
        return race;
    }

    public Driver getDriver() {
        return driver;
    }

    public Team getTeam() {
        return team;
    }

    public SessionType getSessionType() {
        return sessionType;
    }

    public Integer getGridPosition() {
        return gridPosition;
    }

    public Integer getFinishPosition() {
        return finishPosition;
    }

    public String getPositionText() {
        return positionText;
    }

    public String getStatusText() {
        return statusText;
    }

    public Integer getFastestLapRank() {
        return fastestLapRank;
    }

    public BigDecimal getActualPoints() {
        return actualPoints;
    }
}
