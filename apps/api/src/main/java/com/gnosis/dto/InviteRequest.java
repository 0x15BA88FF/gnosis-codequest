package com.gnosis.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record InviteRequest(
        @NotBlank @Email String inviteeEmail,
        @NotBlank String role
) {}
