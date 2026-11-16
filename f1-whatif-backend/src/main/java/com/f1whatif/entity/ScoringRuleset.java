package com.f1whatif.entity;

import com.f1whatif.scoring.ShortenedPolicy;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "scoring_ruleset")
public class ScoringRuleset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "fastest_lap_point", nullable = false)
    private BigDecimal fastestLapPoint = BigDecimal.ZERO;

    @Column(name = "fastest_lap_requires_top_ten", nullable = false)
    private boolean fastestLapRequiresTopTen;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "ruleset_race_points", joinColumns = @JoinColumn(name = "ruleset_id"))
    @MapKeyColumn(name = "finish_position")
    @Column(name = "points", nullable = false)
    private Map<Integer, BigDecimal> racePoints = new HashMap<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "ruleset_sprint_points", joinColumns = @JoinColumn(name = "ruleset_id"))
    @MapKeyColumn(name = "finish_position")
    @Column(name = "points", nullable = false)
    private Map<Integer, BigDecimal> sprintPoints = new HashMap<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "shortened_policy", nullable = false)
    private ShortenedPolicy shortenedPolicy = ShortenedPolicy.NONE;

    protected ScoringRuleset() {
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getFastestLapPoint() {
        return fastestLapPoint;
    }

    public boolean isFastestLapRequiresTopTen() {
        return fastestLapRequiresTopTen;
    }

    public Map<Integer, BigDecimal> getRacePoints() {
        return racePoints;
    }

    public Map<Integer, BigDecimal> getSprintPoints() {
        return sprintPoints;
    }

    public ShortenedPolicy getShortenedPolicy() {
        return shortenedPolicy;
    }

    @Override
    public String toString() {
        return "ScoringRuleset [id=" + id + ", code=" + code + ", name=" + name + ", description=" + description
                + ", fastestLapPoint=" + fastestLapPoint + ", fastestLapRequiresTopTen=" + fastestLapRequiresTopTen
                + ", racePoints=" + racePoints + ", sprintPoints=" + sprintPoints + "]";
    }
}
