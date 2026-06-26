package com.gnosis.repository;

import com.gnosis.domain.RefreshToken;
import com.gnosis.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class RefreshTokenRepositoryTest {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void saveAndFindByTokenHash() {
        User user = userRepository.save(new User("bob@example.com", "hash", "Bob"));
        RefreshToken token = new RefreshToken(user, "token-hash-123", Instant.now().plusSeconds(3600));
        token = refreshTokenRepository.save(token);

        Optional<RefreshToken> found = refreshTokenRepository.findByTokenHash("token-hash-123");
        assertThat(found).isPresent();
        assertThat(found.get().getUser().getId()).isEqualTo(user.getId());
        assertThat(found.get().isRevoked()).isFalse();
    }

    @Test
    void deleteByUserId() {
        User user = userRepository.save(new User("carol@example.com", "hash", "Carol"));
        refreshTokenRepository.save(new RefreshToken(user, "hash-1", Instant.now().plusSeconds(3600)));
        refreshTokenRepository.save(new RefreshToken(user, "hash-2", Instant.now().plusSeconds(3600)));

        refreshTokenRepository.deleteByUserId(user.getId());

        assertThat(refreshTokenRepository.count()).isZero();
    }
}
