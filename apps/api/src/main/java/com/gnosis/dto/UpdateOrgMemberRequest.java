package com.gnosis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.util.Map;
import java.util.UUID;

public record UpdateOrgMemberRequest(
        @Pattern(regexp = "MEMBER|ADMIN") String role,
        Map<UUID, String> mindAccess
) {}