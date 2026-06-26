package com.gnosis.dto;

import com.gnosis.domain.Organization;

import java.time.Instant;
import java.util.UUID;

public record OrgResponse(
        UUID id,
        String name,
        UUID ownerId,
        Instant createdAt
) {
    public static OrgResponse from(Organization org) {
        return new OrgResponse(org.getId(), org.getName(), org.getOwner().getId(), org.getCreatedAt());
    }
}
