package com.gnosis.repository;

import com.gnosis.domain.OrgMembership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrgMembershipRepository extends JpaRepository<OrgMembership, UUID> {
    Optional<OrgMembership> findByOrgIdAndUserId(UUID orgId, UUID userId);
    List<OrgMembership> findByUserId(UUID userId);
}
