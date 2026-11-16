package com.f1whatif.repository;

import com.f1whatif.entity.Race;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RaceRepository extends JpaRepository<Race, Long> {

    boolean existsBySeason_Year(int year);
}
