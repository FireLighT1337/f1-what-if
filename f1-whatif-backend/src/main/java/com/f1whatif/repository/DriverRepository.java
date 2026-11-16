package com.f1whatif.repository;

import com.f1whatif.entity.Driver;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverRepository extends JpaRepository<Driver, Long> {

    Optional<Driver> findByExternalId(String externalId);
}
