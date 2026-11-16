package com.f1whatif.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "season")
public class Season {

    @Id
    @Column(name = "season_year")
    private Integer year;

    protected Season() {
    }

    public Season(Integer year) {
        this.year = year;
    }

    public Integer getYear() {
        return year;
    }

    @Override
    public String toString() {
        return "Season [year=" + year + "]";
    }
}
