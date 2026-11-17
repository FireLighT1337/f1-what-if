package com.f1whatif.repository;

import com.f1whatif.entity.Scenario;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScenarioRepository extends JpaRepository<Scenario, Long> {

    List<Scenario> findByOwner_IdOrderByUpdatedAtDesc(Long ownerId);

    Optional<Scenario> findByIdAndOwner_Id(Long id, Long ownerId);

    long countByOwner_Id(Long ownerId);

    Optional<Scenario> findByPublicId(String publicId);
}
