package com.f1whatif.repository;

import com.f1whatif.dto.SeasonDriverRow;
import com.f1whatif.dto.SeasonSummary;
import com.f1whatif.entity.Race;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/** Read-only queries for the lists the frontend needs. */
public interface ReferenceQueryRepository extends Repository<Race, Long> {

    @Query("select new com.f1whatif.dto.SeasonSummary(r.season.year, count(r), "
            + "count(case when r.hasSprint = true then 1 end)) "
            + "from Race r group by r.season.year order by r.season.year desc")
    List<SeasonSummary> findSeasonSummaries();

    @Query("select r from Race r join fetch r.circuit where r.season.year = :year order by r.round")
    List<Race> findRacesWithCircuit(@Param("year") int year);

    @Query("select distinct new com.f1whatif.dto.SeasonDriverRow(d.id, d.code, d.givenName, d.familyName, "
            + "d.nationality, t.name) "
            + "from RaceResult rr join rr.driver d join rr.team t "
            + "where rr.race.season.year = :year "
            + "order by d.familyName, d.givenName, t.name")
    List<SeasonDriverRow> findSeasonDriverRows(@Param("year") int year);
}
