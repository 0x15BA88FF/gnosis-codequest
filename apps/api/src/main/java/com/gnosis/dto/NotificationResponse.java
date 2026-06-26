package com.gnosis.dto;

import com.gnosis.domain.Notification;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String type,
        String title,
        String body,
        String payload,
        boolean read,
        Instant createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getType(), n.getTitle(),
                n.getBody(), n.getPayload(), n.isRead(), n.getCreatedAt()
        );
    }
}
