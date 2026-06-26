package com.gnosis.dto;

import com.gnosis.domain.MindInvite;

import java.time.Instant;
import java.util.UUID;

public record InviteResponse(
        UUID id,
        UUID mindId,
        String inviteeEmail,
        String role,
        String status,
        String token,
        Instant expiresAt,
        Instant createdAt
) {
    public static InviteResponse from(MindInvite invite) {
        return new InviteResponse(
                invite.getId(), invite.getMind().getId(),
                invite.getInviteeEmail(), invite.getRole(),
                invite.getStatus(), invite.getToken(),
                invite.getExpiresAt(), invite.getCreatedAt()
        );
    }
}
