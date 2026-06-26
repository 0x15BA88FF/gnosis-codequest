package com.gnosis.dto;

import jakarta.validation.constraints.Size;

public record UpdateMindRequest(
        @Size(max = 255) String name,
        String description,
        Integer storageQuotaMb
) {}
