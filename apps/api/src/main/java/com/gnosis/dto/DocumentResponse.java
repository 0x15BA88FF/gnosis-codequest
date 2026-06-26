package com.gnosis.dto;

import com.gnosis.domain.Document;

import java.time.Instant;
import java.util.UUID;

public record DocumentResponse(
        UUID id,
        UUID mindId,
        UUID uploadedBy,
        String fileName,
        String mediaType,
        long fileSizeBytes,
        String processingStatus,
        String errorMessage,
        Instant createdAt,
        boolean deleted
) {
    public static DocumentResponse from(Document doc) {
        return new DocumentResponse(
                doc.getId(), doc.getMind().getId(), doc.getUploadedBy().getId(),
                doc.getFileName(), doc.getMediaType(), doc.getFileSizeBytes(),
                doc.getProcessingStatus(), doc.getErrorMessage(),
                doc.getCreatedAt(), doc.getDeletedAt() != null
        );
    }
}
