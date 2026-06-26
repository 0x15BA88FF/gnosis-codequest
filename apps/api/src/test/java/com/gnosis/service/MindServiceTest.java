package com.gnosis.service;

import com.gnosis.domain.*;
import com.gnosis.dto.CreateMindRequest;
import com.gnosis.dto.MindResponse;
import com.gnosis.dto.UpdateMindRequest;
import com.gnosis.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MindServiceTest {

    @Autowired
    private MindService mindService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private User createUser(String email) {
        return userRepository.save(new User(email, "hash", email.split("@")[0]));
    }

    @Test
    void createMind() {
        User owner = createUser("mind-owner@example.com");
        Organization org = organizationRepository.save(new Organization("Org", owner));

        MindResponse response = mindService.create(org.getId(),
                new CreateMindRequest("Test Mind", "A test mind", null), owner.getId());

        assertThat(response.name()).isEqualTo("Test Mind");
        assertThat(response.description()).isEqualTo("A test mind");
        assertThat(response.deleted()).isFalse();
    }

    @Test
    void listByOrg() {
        User owner = createUser("list-mind@example.com");
        Organization org = organizationRepository.save(new Organization("Org", owner));

        mindService.create(org.getId(), new CreateMindRequest("Mind1", null, null), owner.getId());
        mindService.create(org.getId(), new CreateMindRequest("Mind2", null, null), owner.getId());

        List<MindResponse> minds = mindService.listByOrg(org.getId(), owner.getId());
        assertThat(minds).hasSize(2);
    }

    @Test
    void softDelete() {
        User owner = createUser("delete-mind@example.com");
        Organization org = organizationRepository.save(new Organization("Org", owner));

        MindResponse created = mindService.create(org.getId(),
                new CreateMindRequest("ToDelete", null, null), owner.getId());

        mindService.softDelete(created.id());

        assertThat(mindService.listByOrg(org.getId(), owner.getId())).isEmpty();
    }

    @Test
    void updateMind() {
        User owner = createUser("update-mind@example.com");
        Organization org = organizationRepository.save(new Organization("Org", owner));

        MindResponse created = mindService.create(org.getId(),
                new CreateMindRequest("Original", "Desc", null), owner.getId());

        MindResponse updated = mindService.update(created.id(),
                new UpdateMindRequest("Updated", "New desc", 4096));

        assertThat(updated.name()).isEqualTo("Updated");
        assertThat(updated.description()).isEqualTo("New desc");
        assertThat(updated.storageQuotaMb()).isEqualTo(4096);
    }
}
