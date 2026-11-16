package com.f1whatif.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

import com.f1whatif.entity.ScoringRuleset;

public interface ScoringRulesetRepository extends JpaRepository<ScoringRuleset, Long> {

    Optional<ScoringRuleset> findByCode(String code);
}
