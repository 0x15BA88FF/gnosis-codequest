package com.gnosis.repository;

import com.gnosis.domain.Mind;
import com.gnosis.domain.MindInvite;
import com.gnosis.domain.Organization;
import com.gnosis.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class MindInviteRepositoryTest {

    @Autowired
    private MindInviteRepository inviteRepository;

    @Autowired
    private MindRepository mindRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByToken() {
        User user = userRepository.save(new User("karen@example.com", "hash", "Karen"));
        Organization org = organizationRepository.save(new Organization("Org", user));
        Mind mind = mindRepository.save(new Mind(org, "Mind", user));
        MindInvite invite = inviteRepository.save(
                new MindInvite(mind, user, "guest@example.com", "READ", "invite-token", Instant.now().plus(7, ChronoUnit.DAYS)));

        Optional<MindInvite> found = inviteRepository.findByToken("invite-token");
        assertThat(found).isPresent();
        assertThat(found.get().getStatus()).isEqualTo("PENDING");
    }

    @Test
    void findByInviteeEmailAndStatus() {
        User user = userRepository.save(new User("leo@example.com", "hash", "Leo"));
        Organization org = organizationRepository.save(new Organization("Org", user));
        Mind mind = mindRepository.save(new Mind(org, "Mind", user));
        inviteRepository.save(
                new MindInvite(mind, user, "guest@example.com", "READ", "token-1", Instant.now().plus(7, ChronoUnit.DAYS)));

        List<MindInvite> invites = inviteRepository.findByInviteeEmailAndStatus("guest@example.com", "PENDING");
        assertThat(invites).hasSize(1);
    }

    @Test
    void findByMindIdAndInviteeEmailAndStatus() {
        User user = userRepository.save(new User("mia@example.com", "hash", "Mia"));
        Organization org = organizationRepository.save(new Organization("Org", user));
        Mind mind = mindRepository.save(new Mind(org, "Mind", user));
        inviteRepository.save(
                new MindInvite(mind, user, "guest@example.com", "READ", "token-2", Instant.now().plus(7, ChronoUnit.DAYS)));

        Optional<MindInvite> found = inviteRepository.findByMindIdAndInviteeEmailAndStatus(
                mind.getId(), "guest@example.com", "PENDING");
        assertThat(found).isPresent();
    }
}
