package com.gnosis.dto;

import com.gnosis.domain.Mind;

import java.time.Instant;
import java.util.UUID;

public record MindResponse(
        UUID id,
        UUID orgId,
        String name,
        String description,
        int storageQuotaMb,
        UUID createdBy,
        Instant createdAt,
        Instant updatedAt,
        boolean deleted
) {
    public static MindResponse from(Mind mind) {
        return new MindResponse(
                mind.getId(), mind.getOrg().getId(), mind.getName(),
                mind.getDescription(), mind.getStorageQuotaMb(),
                mind.getCreatedBy().getId(), mind.getCreatedAt(),
                mind.getUpdatedAt(), mind.getDeletedAt() != null
        );
    }
}
