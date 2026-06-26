package com.gnosis.dto;

import java.util.UUID;

public record AuthResponse(
        String token,
        String refreshToken,
        UUID userId,
        String email,
        String displayName
) {}
