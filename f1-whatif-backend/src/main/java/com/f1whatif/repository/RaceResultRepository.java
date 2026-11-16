package com.f1whatif.repository;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.f1whatif.entity.RaceResult;

public interface RaceResultRepository extends JpaRepository<RaceResult, Long> {

    @EntityGraph(attributePaths = { "race", "driver" })
    List<RaceResult> findByRace_Season_Year(int year);
}
