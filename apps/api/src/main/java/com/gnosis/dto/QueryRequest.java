package com.gnosis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record QueryRequest(
        @NotBlank String query,
        @NotEmpty List<UUID> mindIds,
        Integer topK
) {
    public int getTopK() {
        return topK != null ? Math.min(topK, 20) : 10;
    }
}
