package com.gnosis.repository;

import com.gnosis.domain.Mind;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MindRepository extends JpaRepository<Mind, UUID> {

    @Modifying
    @Query("delete from Mind m where m.org.id = :orgId")
    void deleteByOrgId(@Param("orgId") UUID orgId);

    long countByOrgId(UUID orgId);

    List<Mind> findByOrgIdAndDeletedAtIsNull(UUID orgId);
}
