package com.gnosis.service;

import com.gnosis.domain.*;
import com.gnosis.dto.InviteResponse;
import com.gnosis.exception.BadRequestException;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class MindInviteService {

    private static final int INVITE_VALIDITY_DAYS = 7;

    private final MindInviteRepository mindInviteRepository;
    private final MindMembershipRepository mindMembershipRepository;
    private final OrgMembershipRepository orgMembershipRepository;
    private final MindRepository mindRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public MindInviteService(MindInviteRepository mindInviteRepository,
                             MindMembershipRepository mindMembershipRepository,
                             OrgMembershipRepository orgMembershipRepository,
                             MindRepository mindRepository,
                             UserRepository userRepository,
                             NotificationService notificationService,
                             EmailService emailService) {
        this.mindInviteRepository = mindInviteRepository;
        this.mindMembershipRepository = mindMembershipRepository;
        this.orgMembershipRepository = orgMembershipRepository;
        this.mindRepository = mindRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Transactional
    public InviteResponse createInvite(UUID mindId, UUID invitedById, String inviteeEmail, String role) {
        Mind mind = mindRepository.findById(mindId)
                .orElseThrow(() -> new ResourceNotFoundException("Mind", mindId));
        User inviter = userRepository.findById(invitedById)
                .orElseThrow(() -> new ResourceNotFoundException("User", invitedById));

        if (mind.getDeletedAt() != null) {
            throw new BadRequestException("Mind has been deleted");
        }

        mindInviteRepository.findByMindIdAndInviteeEmailAndStatus(mindId, inviteeEmail, "PENDING")
                .ifPresent(invite -> { throw new BadRequestException("A pending invite already exists for this email"); });

        String token = generateToken();
        MindInvite invite = new MindInvite(mind, inviter, inviteeEmail, role, token,
                Instant.now().plus(INVITE_VALIDITY_DAYS, ChronoUnit.DAYS));
        invite = mindInviteRepository.save(invite);

        Optional<User> existingUser = userRepository.findByEmail(inviteeEmail);
        if (existingUser.isPresent()) {
            User recipient = existingUser.get();
            notificationService.create(recipient, "MIND_INVITE",
                    "You're invited to " + mind.getName(),
                    inviter.getDisplayName() + " invited you to join " + mind.getName(),
                    "{\"mindId\":\"" + mindId + "\",\"inviteToken\":\"" + token + "\"}");
        }

        try {
            emailService.sendInviteEmail(inviteeEmail, inviter.getDisplayName(), mind.getName(), token);
        } catch (Exception e) {
            // email failure is non-fatal
        }

        return InviteResponse.from(invite);
    }

    @Transactional
    public void acceptInvite(String token, UUID userId) {
        MindInvite invite = mindInviteRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid invite token"));

        if (!"PENDING".equals(invite.getStatus())) {
            throw new BadRequestException("Invite is no longer pending");
        }

        if (invite.getExpiresAt().isBefore(Instant.now())) {
            invite.setStatus("EXPIRED");
            mindInviteRepository.save(invite);
            throw new BadRequestException("Invite has expired");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!user.getEmail().equals(invite.getInviteeEmail())) {
            throw new BadRequestException("Invite token does not match your email");
        }

        Mind mind = invite.getMind();

        Organization org = mind.getOrg();
        orgMembershipRepository.findByOrgIdAndUserId(org.getId(), userId)
                .orElseGet(() -> orgMembershipRepository.save(
                        new OrgMembership(org, user, "MEMBER")));

        mindMembershipRepository.findByMindIdAndUserId(mind.getId(), userId)
                .orElseGet(() -> mindMembershipRepository.save(
                        new MindMembership(mind, user, invite.getRole())));

        invite.setStatus("ACCEPTED");
        mindInviteRepository.save(invite);
    }

    @Transactional
    public void declineInvite(String token) {
        MindInvite invite = mindInviteRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid invite token"));
        if (!"PENDING".equals(invite.getStatus())) {
            throw new BadRequestException("Invite is no longer pending");
        }
        invite.setStatus("DECLINED");
        mindInviteRepository.save(invite);
    }

    public List<InviteResponse> listPending(String email) {
        return mindInviteRepository.findByInviteeEmailAndStatus(email, "PENDING").stream()
                .filter(invite -> invite.getExpiresAt().isAfter(Instant.now()))
                .map(InviteResponse::from)
                .toList();
    }

    @Transactional
    public void resolveOnSignup(String email, UUID userId) {
        List<MindInvite> pending = mindInviteRepository.findByInviteeEmailAndStatus(email, "PENDING");
        for (MindInvite invite : pending) {
            if (invite.getExpiresAt().isAfter(Instant.now())) {
                acceptInvite(invite.getToken(), userId);
            } else {
                invite.setStatus("EXPIRED");
                mindInviteRepository.save(invite);
            }
        }
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
