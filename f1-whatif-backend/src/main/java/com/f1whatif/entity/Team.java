package com.f1whatif.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A constructor (team) in F1 terms. Named Team to avoid clashing with
 * java.lang.reflect.Constructor.
 */
@Entity
@Table(name = "team")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", nullable = false, unique = true)
    private String externalId;

    @Column(nullable = false)
    private String name;

    private String nationality;

    protected Team() {
    }

    public Team(String externalId, String name, String nationality) {
        this.externalId = externalId;
        this.name = name;
        this.nationality = nationality;
    }

    public Long getId() {
        return id;
    }

    public String getExternalId() {
        return externalId;
    }

    public String getName() {
        return name;
    }

    public String getNationality() {
        return nationality;
    }

    @Override
    public String toString() {
        return "Team [id=" + id + ", externalId=" + externalId + ", name=" + name + ", nationality=" + nationality
                + "]";
    }
}
