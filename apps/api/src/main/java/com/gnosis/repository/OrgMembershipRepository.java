package com.gnosis.repository;

import com.gnosis.domain.OrgMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrgMembershipRepository extends JpaRepository<OrgMembership, UUID> {
    Optional<OrgMembership> findByOrgIdAndUserId(UUID orgId, UUID userId);
    List<OrgMembership> findByUserId(UUID userId);
    List<OrgMembership> findByOrgId(UUID orgId);
    long countByOrgId(UUID orgId);

    @Modifying
    @Query("delete from OrgMembership m where m.org.id = :orgId")
    void deleteByOrgId(@Param("orgId") UUID orgId);
}
