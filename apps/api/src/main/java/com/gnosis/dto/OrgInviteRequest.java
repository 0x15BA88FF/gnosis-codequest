package com.gnosis.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OrgInviteRequest(
        @NotBlank @Email String inviteeEmail,
        @NotBlank @Pattern(regexp = "MEMBER|ADMIN") String role
) {}