package com.gnosis.repository;

import com.gnosis.domain.MindMembership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MindMembershipRepository extends JpaRepository<MindMembership, UUID> {
    Optional<MindMembership> findByMindIdAndUserId(UUID mindId, UUID userId);
    List<MindMembership> findByUserId(UUID userId);
    List<MindMembership> findByMindId(UUID mindId);
}
