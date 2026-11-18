package com.f1whatif.repository;

import com.f1whatif.entity.RaceResult;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/** Read-only query for the results of one driver in one season. */
public interface DriverResultQueryRepository extends Repository<RaceResult, Long> {

    @Query("select rr from RaceResult rr join fetch rr.race r join fetch rr.team "
            + "where r.season.year = :year and rr.driver.id = :driverId "
            + "order by r.round, rr.sessionType")
    List<RaceResult> findDriverSeasonResults(@Param("year") int year, @Param("driverId") long driverId);
}
