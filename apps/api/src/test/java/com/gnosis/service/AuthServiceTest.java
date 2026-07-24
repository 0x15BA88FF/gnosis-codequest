package com.gnosis.service;

import com.gnosis.domain.User;
import com.gnosis.dto.AuthResponse;
import com.gnosis.dto.LoginRequest;
import com.gnosis.dto.RegisterRequest;
import com.gnosis.exception.ConflictException;
import com.gnosis.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Test
    void registerCreatesUserAndReturnsToken() {
        RegisterRequest request = new RegisterRequest("test@example.com", "password123", "Test User");
        AuthResponse response = authService.register(request);

        assertThat(response.token()).isNotBlank();
        assertThat(response.email()).isEqualTo("test@example.com");
        assertThat(response.displayName()).isEqualTo("Test User");
    }

    @Test
    void registerThrowsOnDuplicateEmail() {
        authService.register(new RegisterRequest("dup@example.com", "password123", "User1"));
        assertThatThrownBy(() ->
                authService.register(new RegisterRequest("dup@example.com", "password123", "User2"))
        ).isInstanceOf(ConflictException.class);
    }

    @Test
    void loginReturnsToken() {
        authService.register(new RegisterRequest("login@example.com", "password123", "Login User"));
        AuthResponse response = authService.login(new LoginRequest("login@example.com", "password123"));

        assertThat(response.token()).isNotBlank();
    }

    @Test
    void loginThrowsOnWrongPassword() {
        authService.register(new RegisterRequest("wrong@example.com", "password123", "Wrong User"));
        assertThatThrownBy(() ->
                authService.login(new LoginRequest("wrong@example.com", "wrongpassword"))
        ).isInstanceOf(com.gnosis.exception.ResourceNotFoundException.class);
    }
}