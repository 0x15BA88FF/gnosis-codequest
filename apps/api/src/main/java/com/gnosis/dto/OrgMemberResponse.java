package com.gnosis.dto;

import com.gnosis.domain.OrgMembership;
import com.gnosis.domain.User;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record OrgMemberResponse(
        UUID userId,
        String email,
        String displayName,
        String role,
        Instant joinedAt,
        Map<UUID, String> mindAccess
) {
    public static OrgMemberResponse from(OrgMembership membership, Map<UUID, String> mindAccess) {
        User user = membership.getUser();
        return new OrgMemberResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                membership.getRole(),
                membership.getJoinedAt(),
                mindAccess
        );
    }
}