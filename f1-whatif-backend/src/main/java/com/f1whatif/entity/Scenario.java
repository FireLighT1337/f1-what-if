package com.f1whatif.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * A what-if scenario saved by a user: a season, a points system and the options on top of it.
 * Excluded races are kept as round numbers, because race ids change when a season is re-imported.
 */
@Entity
@Table(name = "scenario")
public class Scenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private AppUser owner;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "season_year", nullable = false)
    private int seasonYear;

    @Column(name = "ruleset_code", nullable = false, length = 64)
    private String rulesetCode;

    @Column(name = "include_sprints", nullable = false)
    private boolean includeSprints;

    @Column(name = "count_best")
    private Integer countBest;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "scenario_excluded_driver", joinColumns = @JoinColumn(name = "scenario_id"))
    @Column(name = "driver_id", nullable = false)
    private Set<Long> excludedDriverIds = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "scenario_excluded_round", joinColumns = @JoinColumn(name = "scenario_id"))
    @Column(name = "round_number", nullable = false)
    private Set<Integer> excludedRounds = new HashSet<>();

    /** Set only while the scenario is shared; anyone with this id can view the result. */
    @Column(name = "public_id", length = 36, unique = true)
    private String publicId;

    /** UTC. */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now(ZoneOffset.UTC);

    /** UTC. */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now(ZoneOffset.UTC);

    protected Scenario() {
    }

    public Scenario(AppUser owner, String name, int seasonYear, String rulesetCode, boolean includeSprints,
                    Integer countBest, Set<Long> excludedDriverIds, Set<Integer> excludedRounds) {
        this.owner = owner;
        apply(name, seasonYear, rulesetCode, includeSprints, countBest, excludedDriverIds, excludedRounds);
    }

    /** Replaces all settings of the scenario. */
    public void update(String name, int seasonYear, String rulesetCode, boolean includeSprints,
                       Integer countBest, Set<Long> excludedDriverIds, Set<Integer> excludedRounds) {
        apply(name, seasonYear, rulesetCode, includeSprints, countBest, excludedDriverIds, excludedRounds);
    }

    /** Makes the scenario viewable by anyone with the link. Sharing twice keeps the same link. */
    public void share() {
        if (publicId == null) {
            publicId = UUID.randomUUID().toString();
            touch();
        }
    }

    public void unshare() {
        if (publicId != null) {
            publicId = null;
            touch();
        }
    }

    private void apply(String name, int seasonYear, String rulesetCode, boolean includeSprints,
                       Integer countBest, Set<Long> excludedDriverIds, Set<Integer> excludedRounds) {
        this.name = name;
        this.seasonYear = seasonYear;
        this.rulesetCode = rulesetCode;
        this.includeSprints = includeSprints;
        this.countBest = countBest;
        this.excludedDriverIds.clear();
        if (excludedDriverIds != null) {
            this.excludedDriverIds.addAll(excludedDriverIds);
        }
        this.excludedRounds.clear();
        if (excludedRounds != null) {
            this.excludedRounds.addAll(excludedRounds);
        }
        touch();
    }

    private void touch() {
        this.updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getSeasonYear() {
        return seasonYear;
    }

    public String getRulesetCode() {
        return rulesetCode;
    }

    public boolean isIncludeSprints() {
        return includeSprints;
    }

    public Integer getCountBest() {
        return countBest;
    }

    public Set<Long> getExcludedDriverIds() {
        return Collections.unmodifiableSet(excludedDriverIds);
    }

    public Set<Integer> getExcludedRounds() {
        return Collections.unmodifiableSet(excludedRounds);
    }

    public String getPublicId() {
        return publicId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    /** The owner is a lazy relationship and is left out on purpose. */
    @Override
    public String toString() {
        return "Scenario{id=" + id + ", name=" + name + ", seasonYear=" + seasonYear
                + ", rulesetCode=" + rulesetCode + "}";
    }
}
