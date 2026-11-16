package com.f1whatif.repository;

import com.f1whatif.entity.Circuit;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CircuitRepository extends JpaRepository<Circuit, Long> {

    Optional<Circuit> findByExternalId(String externalId);
}
