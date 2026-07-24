package com.gnosis.repository;

import com.gnosis.domain.MindMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MindMembershipRepository extends JpaRepository<MindMembership, UUID> {
    Optional<MindMembership> findByMindIdAndUserId(UUID mindId, UUID userId);
    List<MindMembership> findByUserId(UUID userId);
    List<MindMembership> findByMindId(UUID mindId);
    List<MindMembership> findByUserIdAndMindOrgId(UUID userId, UUID orgId);

    @Modifying
    @Query("delete from MindMembership m where m.user.id = :userId and m.mind.org.id = :orgId")
    void deleteByUserIdAndMindOrgId(@Param("userId") UUID userId, @Param("orgId") UUID orgId);
}
