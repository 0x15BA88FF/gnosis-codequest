package com.gnosis.repository;

import com.gnosis.domain.Mind;
import com.gnosis.domain.MindMembership;
import com.gnosis.domain.Organization;
import com.gnosis.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class MindMembershipRepositoryTest {

    @Autowired
    private MindMembershipRepository membershipRepository;

    @Autowired
    private MindRepository mindRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByMindIdAndUserId() {
        User user = userRepository.save(new User("ivan@example.com", "hash", "Ivan"));
        Organization org = organizationRepository.save(new Organization("Org", user));
        Mind mind = mindRepository.save(new Mind(org, "Mind", user));
        MindMembership ms = membershipRepository.save(new MindMembership(mind, user, "ADMIN"));

        Optional<MindMembership> found = membershipRepository.findByMindIdAndUserId(mind.getId(), user.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getRole()).isEqualTo("ADMIN");
    }

    @Test
    void findByUserId() {
        User user = userRepository.save(new User("judy@example.com", "hash", "Judy"));
        Organization org = organizationRepository.save(new Organization("Org", user));
        Mind mind1 = mindRepository.save(new Mind(org, "Mind1", user));
        Mind mind2 = mindRepository.save(new Mind(org, "Mind2", user));
        membershipRepository.save(new MindMembership(mind1, user, "READ"));
        membershipRepository.save(new MindMembership(mind2, user, "READ"));

        List<MindMembership> memberships = membershipRepository.findByUserId(user.getId());
        assertThat(memberships).hasSize(2);
    }
}
