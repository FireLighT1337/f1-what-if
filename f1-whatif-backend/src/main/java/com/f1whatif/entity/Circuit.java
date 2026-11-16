package com.f1whatif.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "circuit")
public class Circuit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", nullable = false, unique = true)
    private String externalId;

    @Column(nullable = false)
    private String name;

    private String locality;

    private String country;

    protected Circuit() {
    }

    public Circuit(String externalId, String name, String locality, String country) {
        this.externalId = externalId;
        this.name = name;
        this.locality = locality;
        this.country = country;
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

    public String getLocality() {
        return locality;
    }

    public String getCountry() {
        return country;
    }

    @Override
    public String toString() {
        return "Circuit [id=" + id + ", externalId=" + externalId + ", name=" + name + ", locality=" + locality
                + ", country=" + country + "]";
    }

}
