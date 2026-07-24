package com.gnosis.dto;

import com.gnosis.domain.OrgInvite;

import java.time.Instant;
import java.util.UUID;

public record OrgInviteResponse(
        UUID id,
        UUID orgId,
        String orgName,
        String inviteeEmail,
        String role,
        String status,
        Instant expiresAt,
        String token
) {
    public static OrgInviteResponse from(OrgInvite invite) {
        return new OrgInviteResponse(
                invite.getId(),
                invite.getOrg().getId(),
                invite.getOrg().getName(),
                invite.getInviteeEmail(),
                invite.getRole(),
                invite.getStatus(),
                invite.getExpiresAt(),
                invite.getToken()
        );
    }
}