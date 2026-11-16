package com.f1whatif.repository;

import com.f1whatif.entity.ShortenedRace;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShortenedRaceRepository extends JpaRepository<ShortenedRace, Long> {

    List<ShortenedRace> findBySeasonYear(int seasonYear);
}
