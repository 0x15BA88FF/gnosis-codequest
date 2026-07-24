package com.gnosis.service;

import com.gnosis.domain.User;
import com.gnosis.dto.*;
import com.gnosis.exception.ConflictException;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.UserRepository;
import com.gnosis.config.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final OrgInviteService orgInviteService;

    public AuthService(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder,
            OrgInviteService orgInviteService
    ) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.orgInviteService = orgInviteService;
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

        orgInviteService.resolveOnSignup(user.getEmail(), user.getId());

        String accessToken = jwtUtil.generateToken(user.getId());

        return new AuthResponse(accessToken, user.getId(), user.getEmail(), user.getDisplayName());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.email()));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResourceNotFoundException("User", request.email());
        }

        String accessToken = jwtUtil.generateToken(user.getId());

        return new AuthResponse(accessToken, user.getId(), user.getEmail(), user.getDisplayName());
    }

    public UserResponse me(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getCreatedAt());
    }

    public void logout(UUID userId) {
        // TODO: Implement token blacklist/refresh token revocation when refresh tokens are added
    }
}