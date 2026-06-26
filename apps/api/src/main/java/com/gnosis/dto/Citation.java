package com.gnosis.dto;

import java.util.UUID;

public record Citation(
        UUID chunkId,
        UUID documentId,
        String fileName,
        String content,
        double score
) {
}
