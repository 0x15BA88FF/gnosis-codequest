package com.gnosis.dto;

import com.gnosis.domain.MindMembership;

import java.time.Instant;
import java.util.UUID;

public record MindMemberResponse(
        UUID userId,
        String email,
        String displayName,
        String role,
        Instant joinedAt
) {
    public static MindMemberResponse from(MindMembership ms) {
        return new MindMemberResponse(
                ms.getUser().getId(), ms.getUser().getEmail(), ms.getUser().getDisplayName(),
                ms.getRole(), ms.getJoinedAt()
        );
    }
}
