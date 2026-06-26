package com.gnosis.service;

import com.gnosis.domain.*;
import com.gnosis.dto.InviteResponse;
import com.gnosis.exception.BadRequestException;
import com.gnosis.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MindInviteServiceTest {

    @Autowired
    private MindInviteService mindInviteService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private MindRepository mindRepository;

    @Autowired
    private MindInviteRepository mindInviteRepository;

    private User createUser(String email) {
        return userRepository.save(new User(email, "hash", email.split("@")[0]));
    }

    @Test
    void createInvite() {
        User owner = createUser("invite-owner@example.com");
        Organization org = organizationRepository.save(new Organization("Org", owner));
        Mind mind = mindRepository.save(new Mind(org, "Test Mind", owner));

        InviteResponse invite = mindInviteService.createInvite(
                mind.getId(), owner.getId(), "guest@example.com", "READ");

        assertThat(invite.inviteeEmail()).isEqualTo("guest@example.com");
        assertThat(invite.status()).isEqualTo("PENDING");
    }

    @Test
    void acceptInviteForExistingUser() {
        User owner = createUser("accept-owner@example.com");
        User guest = createUser("accept-guest@example.com");
        Organization org = organizationRepository.save(new Organization("Org", owner));
        Mind mind = mindRepository.save(new Mind(org, "Test Mind", owner));

        InviteResponse invite = mindInviteService.createInvite(
                mind.getId(), owner.getId(), "accept-guest@example.com", "READ");

        mindInviteService.acceptInvite(invite.token(), guest.getId());

        MindInvite updated = mindInviteRepository.findByToken(invite.token()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo("ACCEPTED");
    }

    @Test
    void declineInvite() {
        User owner = createUser("decline-owner@example.com");
        Organization org = organizationRepository.save(new Organization("Org", owner));
        Mind mind = mindRepository.save(new Mind(org, "Test Mind", owner));

        InviteResponse invite = mindInviteService.createInvite(
                mind.getId(), owner.getId(), "decline-guest@example.com", "READ");

        mindInviteService.declineInvite(invite.token());

        MindInvite updated = mindInviteRepository.findByToken(invite.token()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo("DECLINED");
    }

    @Test
    void listPending() {
        User owner = createUser("list-pending@example.com");
        Organization org = organizationRepository.save(new Organization("Org", owner));
        Mind mind = mindRepository.save(new Mind(org, "Test Mind", owner));

        mindInviteService.createInvite(mind.getId(), owner.getId(), "pending1@example.com", "READ");
        mindInviteService.createInvite(mind.getId(), owner.getId(), "pending2@example.com", "READ_WRITE");

        List<InviteResponse> pending = mindInviteService.listPending("pending1@example.com");
        assertThat(pending).hasSize(1);
    }

    @Test
    void duplicateInviteThrows() {
        User owner = createUser("dup-owner@example.com");
        Organization org = organizationRepository.save(new Organization("Org", owner));
        Mind mind = mindRepository.save(new Mind(org, "Test Mind", owner));

        mindInviteService.createInvite(mind.getId(), owner.getId(), "dup@example.com", "READ");
        assertThatThrownBy(() ->
                mindInviteService.createInvite(mind.getId(), owner.getId(), "dup@example.com", "READ")
        ).isInstanceOf(BadRequestException.class);
    }
}
