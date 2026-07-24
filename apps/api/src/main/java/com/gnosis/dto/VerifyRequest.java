package com.gnosis.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyRequest(
        @NotBlank String reference
) {}
