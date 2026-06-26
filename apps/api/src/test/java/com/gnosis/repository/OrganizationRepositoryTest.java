package com.gnosis.repository;

import com.gnosis.domain.Organization;
import com.gnosis.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class OrganizationRepositoryTest {

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void saveAndFind() {
        User owner = userRepository.save(new User("eve@example.com", "hash", "Eve"));
        Organization org = organizationRepository.save(new Organization("Acme Corp", owner));

        assertThat(org.getId()).isNotNull();
        assertThat(org.getName()).isEqualTo("Acme Corp");
        assertThat(org.getOwner().getId()).isEqualTo(owner.getId());
        assertThat(org.getCreatedAt()).isNotNull();
    }
}
