package com.f1whatif.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "driver")
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", nullable = false, unique = true)
    private String externalId;

    @Column(name = "given_name", nullable = false)
    private String givenName;

    @Column(name = "family_name", nullable = false)
    private String familyName;

    private String code;

    private String nationality;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "wikipedia_url")
    private String wikipediaUrl;

    protected Driver() {
    }

    public Driver(String externalId, String givenName, String familyName, String code,
            String nationality, LocalDate dateOfBirth) {
        this.externalId = externalId;
        this.givenName = givenName;
        this.familyName = familyName;
        this.code = code;
        this.nationality = nationality;
        this.dateOfBirth = dateOfBirth;
    }

    public Long getId() {
        return id;
    }

    public String getExternalId() {
        return externalId;
    }

    public String getGivenName() {
        return givenName;
    }

    public String getFamilyName() {
        return familyName;
    }

    public String getCode() {
        return code;
    }

    public String getNationality() {
        return nationality;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public String getFullName() {
        return givenName + " " + familyName;
    }

    public String getWikipediaUrl() {
        return wikipediaUrl;
    }

    @Override
    public String toString() {
        return "Driver [id=" + id + ", externalId=" + externalId + ", givenName=" + givenName + ", familyName="
                + familyName + ", code=" + code + ", nationality=" + nationality + ", dateOfBirth=" + dateOfBirth + "]";
    }

    /** Called by the importer: keeps the first link, never overwrites it. */
    public void fillWikipediaUrlIfMissing(String url) {
        if (wikipediaUrl == null && url != null && !url.isBlank()) {
            wikipediaUrl = url.trim();
        }
    }
}
