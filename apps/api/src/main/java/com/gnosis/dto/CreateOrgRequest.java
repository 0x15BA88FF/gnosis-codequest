package com.gnosis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateOrgRequest(
        @NotBlank @Size(max = 255) String name
) {}
