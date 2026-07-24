package com.gnosis.controller;

import com.gnosis.config.JwtUtil;
import com.gnosis.domain.User;
import com.gnosis.dto.*;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.UserRepository;
import com.gnosis.service.AuthService;
import com.gnosis.util.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public AuthController(AuthService authService, UserRepository userRepository, JwtUtil jwtUtil) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        User user = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "current"));
        return ResponseEntity.ok(authService.me(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        authService.logout(SecurityUtils.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/debug/token")
    public ResponseEntity<?> debugToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body("Missing or invalid Authorization header");
        }
        String token = authHeader.substring(7);
        try {
            UUID userId = jwtUtil.extractUserId(token);
            boolean valid = jwtUtil.isValid(token);
            User user = userRepository.findById(userId).orElse(null);
            return ResponseEntity.ok(new DebugTokenResponse(valid, userId.toString(), user != null ? user.getEmail() : "not found"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Token validation failed: " + e.getMessage());
        }
    }

    private record DebugTokenResponse(boolean valid, String userId, String email) {}
}