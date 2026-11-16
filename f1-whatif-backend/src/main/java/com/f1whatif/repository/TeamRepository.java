package com.f1whatif.repository;

import com.f1whatif.entity.Team;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {

    Optional<Team> findByExternalId(String externalId);
}
