package com.f1whatif.repository;

import com.f1whatif.entity.RaceMultiplier;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RaceMultiplierRepository extends JpaRepository<RaceMultiplier, Long> {

    List<RaceMultiplier> findBySeasonYear(int seasonYear);
}
