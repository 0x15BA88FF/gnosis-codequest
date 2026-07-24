package com.gnosis.repository;

import com.gnosis.domain.OrgInvite;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrgInviteRepository extends JpaRepository<OrgInvite, UUID> {
    @EntityGraph(attributePaths = { "org", "invitedBy" })
    Optional<OrgInvite> findByToken(String token);

    @EntityGraph(attributePaths = { "org", "invitedBy" })
    Optional<OrgInvite> findByOrgIdAndInviteeEmailAndStatus(UUID orgId, String inviteeEmail, String status);

    @EntityGraph(attributePaths = { "org", "invitedBy" })
    List<OrgInvite> findByInviteeEmailAndStatus(String inviteeEmail, String status);

    @EntityGraph(attributePaths = { "org", "invitedBy" })
    List<OrgInvite> findByOrgIdAndStatus(UUID orgId, String status);
}