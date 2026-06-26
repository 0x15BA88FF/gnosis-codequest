package com.gnosis.repository;

import com.gnosis.domain.EmailVerificationToken;
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
class EmailVerificationTokenRepositoryTest {

    @Autowired
    private EmailVerificationTokenRepository repository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void saveAndFindByToken() {
        User user = userRepository.save(new User("dave@example.com", "hash", "Dave"));
        EmailVerificationToken evt = new EmailVerificationToken(user, "verify-token-abc", Instant.now().plusSeconds(86400));
        evt = repository.save(evt);

        Optional<EmailVerificationToken> found = repository.findByToken("verify-token-abc");
        assertThat(found).isPresent();
        assertThat(found.get().getUser().getId()).isEqualTo(user.getId());
        assertThat(found.get().isUsed()).isFalse();
    }
}
