package com.gnosis.service;

import com.gnosis.domain.*;
import com.gnosis.dto.OrgInviteResponse;
import com.gnosis.exception.BadRequestException;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.*;
import org.springframework.security.access.AccessDeniedException;
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
public class OrgInviteService {

    private static final int INVITE_VALIDITY_DAYS = 7;

    private final OrgInviteRepository orgInviteRepository;
    private final OrgMembershipRepository orgMembershipRepository;
    private final MindMembershipRepository mindMembershipRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public OrgInviteService(OrgInviteRepository orgInviteRepository,
                            OrgMembershipRepository orgMembershipRepository,
                            MindMembershipRepository mindMembershipRepository,
                            OrganizationRepository organizationRepository,
                            UserRepository userRepository,
                            NotificationService notificationService,
                            EmailService emailService) {
        this.orgInviteRepository = orgInviteRepository;
        this.orgMembershipRepository = orgMembershipRepository;
        this.mindMembershipRepository = mindMembershipRepository;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Transactional
    public OrgInviteResponse createInvite(UUID orgId, UUID invitedById, String inviteeEmail, String role) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));
        User inviter = userRepository.findById(invitedById)
                .orElseThrow(() -> new ResourceNotFoundException("User", invitedById));

        if (!role.equals(OrgMembership.ROLE_MEMBER) && !role.equals(OrgMembership.ROLE_ADMIN)) {
            throw new BadRequestException("Invalid role. Must be MEMBER or ADMIN");
        }

        orgInviteRepository.findByOrgIdAndInviteeEmailAndStatus(orgId, inviteeEmail, OrgInvite.STATUS_PENDING)
                .ifPresent(invite -> { throw new BadRequestException("A pending invite already exists for this email"); });

        String token = generateToken();
        OrgInvite invite = new OrgInvite(org, inviter, inviteeEmail, role, token,
                Instant.now().plus(INVITE_VALIDITY_DAYS, ChronoUnit.DAYS));
        invite = orgInviteRepository.save(invite);

        Optional<User> existingUser = userRepository.findByEmail(inviteeEmail);
        if (existingUser.isPresent()) {
            User recipient = existingUser.get();
            notificationService.create(recipient, "ORG_INVITE",
                    "You're invited to " + org.getName(),
                    inviter.getDisplayName() + " invited you to join " + org.getName(),
                    "{\"orgId\":\"" + orgId + "\",\"inviteToken\":\"" + token + "\"}");
        }

        try {
            emailService.sendInviteEmail(inviteeEmail, inviter.getDisplayName(), org.getName(), token);
        } catch (Exception e) {
            // email failure is non-fatal
        }

        return OrgInviteResponse.from(invite);
    }

    @Transactional
    public void acceptInvite(String token, UUID userId) {
        OrgInvite invite = orgInviteRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid invite token"));

        if (!OrgInvite.STATUS_PENDING.equals(invite.getStatus())) {
            throw new BadRequestException("Invite is no longer pending");
        }

        if (invite.getExpiresAt().isBefore(Instant.now())) {
            invite.setStatus(OrgInvite.STATUS_EXPIRED);
            orgInviteRepository.save(invite);
            throw new BadRequestException("Invite has expired");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!user.getEmail().equals(invite.getInviteeEmail())) {
            throw new BadRequestException("Invite token does not match your email");
        }

        Organization org = invite.getOrg();
        orgMembershipRepository.findByOrgIdAndUserId(org.getId(), userId)
                .orElseGet(() -> orgMembershipRepository.save(
                        new OrgMembership(org, user, invite.getRole())));

        invite.setStatus(OrgInvite.STATUS_ACCEPTED);
        orgInviteRepository.save(invite);
    }

    @Transactional
    public void declineInvite(String token) {
        OrgInvite invite = orgInviteRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid invite token"));
        if (!OrgInvite.STATUS_PENDING.equals(invite.getStatus())) {
            throw new BadRequestException("Invite is no longer pending");
        }
        invite.setStatus(OrgInvite.STATUS_DECLINED);
        orgInviteRepository.save(invite);
    }

    public List<OrgInviteResponse> listPendingByOrg(UUID orgId) {
        List<OrgInvite> all = orgInviteRepository.findByOrgIdAndStatus(orgId, OrgInvite.STATUS_PENDING);
        return all.stream()
                .filter(invite -> invite.getExpiresAt().isAfter(Instant.now()))
                .map(OrgInviteResponse::from)
                .toList();
    }

    @Transactional
    public void revokeInvite(UUID orgId, UUID inviteId, UUID currentUserId) {
        OrgMembership membership = orgMembershipRepository.findByOrgIdAndUserId(orgId, currentUserId)
                .orElseThrow(() -> new AccessDeniedException("Not a member of this organization"));
        if (!OrgMembership.ROLE_OWNER.equals(membership.getRole())
                && !OrgMembership.ROLE_ADMIN.equals(membership.getRole())) {
            throw new AccessDeniedException("Only admins can cancel invites");
        }
        OrgInvite invite = orgInviteRepository.findById(inviteId)
                .orElseThrow(() -> new ResourceNotFoundException("Invite", inviteId));
        if (!invite.getOrg().getId().equals(orgId)) {
            throw new ResourceNotFoundException("Invite", inviteId);
        }
        invite.setStatus(OrgInvite.STATUS_REVOKED);
        orgInviteRepository.save(invite);
    }

    public List<OrgInviteResponse> listPendingByEmail(String email) {
        return orgInviteRepository.findByInviteeEmailAndStatus(email, OrgInvite.STATUS_PENDING).stream()
                .filter(invite -> invite.getExpiresAt().isAfter(Instant.now()))
                .map(OrgInviteResponse::from)
                .toList();
    }

    @Transactional
    public void resolveOnSignup(String email, UUID userId) {
        List<OrgInvite> pending = orgInviteRepository.findByInviteeEmailAndStatus(email, OrgInvite.STATUS_PENDING);
        for (OrgInvite invite : pending) {
            if (invite.getExpiresAt().isAfter(Instant.now())) {
                acceptInvite(invite.getToken(), userId);
            } else {
                invite.setStatus(OrgInvite.STATUS_EXPIRED);
                orgInviteRepository.save(invite);
            }
        }
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}