package com.f1whatif.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "race")
public class Race {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "season_year")
    private Season season;

    @Column(name = "round_number", nullable = false)
    private int round;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "circuit_id")
    private Circuit circuit;

    @Column(nullable = false)
    private String name;

    @Column(name = "race_date")
    private LocalDate raceDate;

    @Column(name = "has_sprint", nullable = false)
    private boolean hasSprint;

    protected Race() {
    }

    public Race(Season season, int round, Circuit circuit, String name, LocalDate raceDate, boolean hasSprint) {
        this.season = season;
        this.round = round;
        this.circuit = circuit;
        this.name = name;
        this.raceDate = raceDate;
        this.hasSprint = hasSprint;
    }

    public Long getId() {
        return id;
    }

    public Season getSeason() {
        return season;
    }

    public int getRound() {
        return round;
    }

    public Circuit getCircuit() {
        return circuit;
    }

    public String getName() {
        return name;
    }

    public LocalDate getRaceDate() {
        return raceDate;
    }

    public boolean isHasSprint() {
        return hasSprint;
    }

    @Override
    public String toString() {
        return "Race [id=" + id + ", season=" + season + ", round=" + round + ", circuit=" + circuit + ", name=" + name
                + ", raceDate=" + raceDate + ", hasSprint=" + hasSprint + "]";
    }
}
