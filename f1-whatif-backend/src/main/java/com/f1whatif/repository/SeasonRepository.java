package com.f1whatif.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.f1whatif.entity.Season;

public interface SeasonRepository extends JpaRepository<Season, Integer> {
}
