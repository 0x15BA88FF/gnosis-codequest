package com.gnosis.repository;

import com.gnosis.domain.MindInvite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MindInviteRepository extends JpaRepository<MindInvite, UUID> {
    Optional<MindInvite> findByToken(String token);
    List<MindInvite> findByInviteeEmailAndStatus(String inviteeEmail, String status);
    Optional<MindInvite> findByMindIdAndInviteeEmailAndStatus(UUID mindId, String inviteeEmail, String status);
}
