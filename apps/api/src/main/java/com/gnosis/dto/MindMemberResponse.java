package com.gnosis.dto;

import com.gnosis.domain.MindMembership;

import java.time.Instant;
import java.util.UUID;

public record MindMemberResponse(
        UUID id,
        UUID userId,
        String userDisplayName,
        String role,
        Instant joinedAt
) {
    public static MindMemberResponse from(MindMembership ms) {
        return new MindMemberResponse(
                ms.getId(), ms.getUser().getId(), ms.getUser().getDisplayName(),
                ms.getRole(), ms.getJoinedAt()
        );
    }
}
