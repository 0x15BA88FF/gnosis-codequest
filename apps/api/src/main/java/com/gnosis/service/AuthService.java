package com.gnosis.service;

import com.gnosis.domain.EmailVerificationToken;
import com.gnosis.domain.User;
import com.gnosis.dto.*;
import com.gnosis.exception.BadRequestException;
import com.gnosis.exception.ConflictException;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.EmailVerificationTokenRepository;
import com.gnosis.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

@Service
public class AuthService {

    private static final int VERIFICATION_TOKEN_VALIDITY_HOURS = 24;

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final TokenService tokenService;
    private final PasswordEncoder passwordEncoder;
    private final MindInviteService mindInviteService;

    public AuthService(
            UserRepository userRepository,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            TokenService tokenService,
            PasswordEncoder passwordEncoder,
            MindInviteService mindInviteService
    ) {
        this.userRepository = userRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.tokenService = tokenService;
        this.passwordEncoder = passwordEncoder;
        this.mindInviteService = mindInviteService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new ConflictException("Email already registered");
        }

        User user = new User(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.displayName()
        );
        user = userRepository.save(user);

        mindInviteService.resolveOnSignup(user.getEmail(), user.getId());

        createEmailVerificationToken(user);

        String accessToken = tokenService.generateAccessToken(user);
        String refreshToken = tokenService.generateRefreshToken(user);

        return new AuthResponse(accessToken, refreshToken, user.getId(), user.getEmail(), user.getDisplayName());
    }

    @Transactional
    public void verifyEmail(String token) {
        EmailVerificationToken evt = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid verification token"));

        if (evt.isUsed()) {
            throw new BadRequestException("Verification token already used");
        }

        if (evt.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Verification token has expired");
        }

        evt.setUsed(true);
        evt.getUser().setEmailVerified(true);
        emailVerificationTokenRepository.save(evt);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.email()));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }

        String accessToken = tokenService.generateAccessToken(user);
        String refreshToken = tokenService.generateRefreshToken(user);

        return new AuthResponse(accessToken, refreshToken, user.getId(), user.getEmail(), user.getDisplayName());
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        UUID userId = tokenService.validateRefreshToken(request.refreshToken());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        String newRefreshToken = tokenService.rotateRefreshToken(request.refreshToken());
        String accessToken = tokenService.generateAccessToken(user);

        return new AuthResponse(accessToken, newRefreshToken, user.getId(), user.getEmail(), user.getDisplayName());
    }

    @Transactional
    public void logout(String refreshToken) {
        UUID userId = tokenService.validateRefreshToken(refreshToken);
        tokenService.revokeAllUserTokens(userId);
    }

    public UserResponse me(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(),
                user.isEmailVerified(), user.getCreatedAt());
    }

    private void createEmailVerificationToken(User user) {
        String token = generateRandomToken();
        EmailVerificationToken evt = new EmailVerificationToken(
                user,
                token,
                Instant.now().plus(VERIFICATION_TOKEN_VALIDITY_HOURS, ChronoUnit.HOURS)
        );
        emailVerificationTokenRepository.save(evt);
    }

    private String generateRandomToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
