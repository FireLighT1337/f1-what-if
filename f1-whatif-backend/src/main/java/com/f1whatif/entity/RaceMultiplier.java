package com.f1whatif.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

/** A race whose race points were multiplied, for example the double-points finale of 2014. */
@Entity
@Table(name = "race_multiplier")
public class RaceMultiplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "season_year", nullable = false)
    private int seasonYear;

    @Column(name = "round_number", nullable = false)
    private int round;

    @Column(nullable = false, precision = 4, scale = 2)
    private BigDecimal multiplier;

    private String note;

    protected RaceMultiplier() {
    }

    public RaceMultiplier(int seasonYear, int round, BigDecimal multiplier, String note) {
        this.seasonYear = seasonYear;
        this.round = round;
        this.multiplier = multiplier;
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

    public BigDecimal getMultiplier() {
        return multiplier;
    }

    public String getNote() {
        return note;
    }
}
