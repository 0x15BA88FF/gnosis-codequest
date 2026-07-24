package com.gnosis.dto;

import com.gnosis.domain.Organization;

import java.time.Instant;
import java.util.UUID;

public record OrgResponse(
        UUID id,
        String name,
        UUID ownerId,
        Instant createdAt,
        long memberCount,
        long mindCount,
        String role
) {
    public static OrgResponse from(Organization org, long memberCount, long mindCount, String role) {
        return new OrgResponse(org.getId(), org.getName(), org.getOwner().getId(), org.getCreatedAt(), memberCount, mindCount, role);
    }
}
