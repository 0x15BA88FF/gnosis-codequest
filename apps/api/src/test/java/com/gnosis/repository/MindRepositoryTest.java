package com.gnosis.repository;

import com.gnosis.domain.Mind;
import com.gnosis.domain.Organization;
import com.gnosis.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class MindRepositoryTest {

    @Autowired
    private MindRepository mindRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void saveAndFind() {
        User user = userRepository.save(new User("heidi@example.com", "hash", "Heidi"));
        Organization org = organizationRepository.save(new Organization("Org", user));
        Mind mind = mindRepository.save(new Mind(org, "My Mind", user));

        assertThat(mind.getId()).isNotNull();
        assertThat(mind.getName()).isEqualTo("My Mind");
        assertThat(mind.getStorageQuotaMb()).isEqualTo(2048);
        assertThat(mind.getDeletedAt()).isNull();
    }
}
