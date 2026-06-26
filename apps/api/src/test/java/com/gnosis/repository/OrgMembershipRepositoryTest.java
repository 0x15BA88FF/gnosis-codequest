package com.gnosis.repository;

import com.gnosis.domain.OrgMembership;
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
class OrgMembershipRepositoryTest {

    @Autowired
    private OrgMembershipRepository membershipRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByOrgIdAndUserId() {
        User owner = userRepository.save(new User("frank@example.com", "hash", "Frank"));
        Organization org = organizationRepository.save(new Organization("Org", owner));
        OrgMembership membership = membershipRepository.save(new OrgMembership(org, owner, "OWNER"));

        Optional<OrgMembership> found = membershipRepository.findByOrgIdAndUserId(org.getId(), owner.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getRole()).isEqualTo("OWNER");
    }

    @Test
    void findByUserId() {
        User user = userRepository.save(new User("grace@example.com", "hash", "Grace"));
        Organization org1 = organizationRepository.save(new Organization("Org1", user));
        Organization org2 = organizationRepository.save(new Organization("Org2", user));
        membershipRepository.save(new OrgMembership(org1, user, "MEMBER"));
        membershipRepository.save(new OrgMembership(org2, user, "MEMBER"));

        List<OrgMembership> memberships = membershipRepository.findByUserId(user.getId());
        assertThat(memberships).hasSize(2);
    }
}
