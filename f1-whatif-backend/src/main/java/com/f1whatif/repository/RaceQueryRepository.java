package com.f1whatif.repository;

import com.f1whatif.entity.Race;
import java.util.List;
import org.springframework.data.repository.Repository;

/** Read-only lookups for races. A marker Repository, so it exposes only the methods declared here. */
public interface RaceQueryRepository extends Repository<Race, Long> {

    List<Race> findBySeason_Year(int year);
}
