package com.gnosis.service;

import com.gnosis.config.JwtUtil;
import com.gnosis.domain.RefreshToken;
import com.gnosis.domain.User;
import com.gnosis.exception.BadRequestException;
import com.gnosis.repository.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

@Service
public class TokenService {

    private static final long REFRESH_TOKEN_VALIDITY_DAYS = 30;

    private final JwtUtil jwtUtil;
    private final RefreshTokenRepository refreshTokenRepository;

    public TokenService(JwtUtil jwtUtil, RefreshTokenRepository refreshTokenRepository) {
        this.jwtUtil = jwtUtil;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public String generateAccessToken(User user) {
        return jwtUtil.generateToken(user.getId());
    }

    public String generateRefreshToken(User user) {
        String rawToken = generateRandomToken();
        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = new RefreshToken(
                user,
                tokenHash,
                Instant.now().plus(REFRESH_TOKEN_VALIDITY_DAYS, ChronoUnit.DAYS)
        );
        refreshTokenRepository.save(refreshToken);

        return rawToken;
    }

    @Transactional
    public String rotateRefreshToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (stored.isRevoked()) {
            refreshTokenRepository.deleteByUserId(stored.getUser().getId());
            throw new BadRequestException("Refresh token has been revoked");
        }

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Refresh token has expired");
        }

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return generateRefreshToken(stored.getUser());
    }

    @Transactional
    public void revokeAllUserTokens(UUID userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    public UUID validateRefreshToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (stored.isRevoked()) {
            refreshTokenRepository.deleteByUserId(stored.getUser().getId());
            throw new BadRequestException("Refresh token has been revoked");
        }

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Refresh token has expired");
        }

        return stored.getUser().getId();
    }

    private String generateRandomToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(token.getBytes());
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
