package com.gnosis.controller;

import com.gnosis.domain.User;
import com.gnosis.dto.*;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.UserRepository;
import com.gnosis.service.OrganizationService;
import com.gnosis.service.OrgInviteService;
import com.gnosis.util.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;
    private final OrgInviteService orgInviteService;
    private final UserRepository userRepository;

    public OrganizationController(OrganizationService organizationService,
                                  OrgInviteService orgInviteService,
                                  UserRepository userRepository) {
        this.organizationService = organizationService;
        this.orgInviteService = orgInviteService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<OrgResponse> create(@Valid @RequestBody CreateOrgRequest request) {
        User currentUser = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "current"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(organizationService.create(request.name(), currentUser));
    }

    @GetMapping
    public ResponseEntity<List<OrgResponse>> list() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(organizationService.listByUser(userId));
    }

    @GetMapping("/{orgId}")
    public ResponseEntity<OrgResponse> get(@PathVariable UUID orgId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(organizationService.getById(orgId, userId));
    }

    @PatchMapping("/{orgId}")
    public ResponseEntity<OrgResponse> rename(@PathVariable UUID orgId,
                                               @Valid @RequestBody UpdateOrgRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(organizationService.rename(orgId, request.name(), userId));
    }

    @DeleteMapping("/{orgId}")
    public ResponseEntity<Void> delete(@PathVariable UUID orgId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        organizationService.delete(orgId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{orgId}/invites")
    public ResponseEntity<OrgInviteResponse> createInvite(@PathVariable UUID orgId,
                                                           @Valid @RequestBody OrgInviteRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        OrgInviteResponse response = orgInviteService.createInvite(orgId, userId, request.inviteeEmail(), request.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{orgId}/invites")
    public ResponseEntity<List<OrgInviteResponse>> listInvites(@PathVariable UUID orgId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<OrgInviteResponse> result = orgInviteService.listPendingByOrg(orgId);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{orgId}/invites/{inviteId}")
    public ResponseEntity<Void> cancelInvite(@PathVariable UUID orgId, @PathVariable UUID inviteId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        orgInviteService.revokeInvite(orgId, inviteId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{orgId}/members")
    public ResponseEntity<List<OrgMemberResponse>> listMembers(@PathVariable UUID orgId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(organizationService.listMembers(orgId, userId));
    }

    @PatchMapping("/{orgId}/members/{userId}")
    public ResponseEntity<OrgMemberResponse> manageMember(@PathVariable UUID orgId,
                                                           @PathVariable UUID userId,
                                                           @Valid @RequestBody UpdateOrgMemberRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        OrgMemberResponse response = organizationService.manageMember(
                orgId, userId, currentUserId, request.role(), request.mindAccess());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{orgId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable UUID orgId, @PathVariable UUID userId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        organizationService.removeMember(orgId, userId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{orgId}/leave")
    public ResponseEntity<Void> leave(@PathVariable UUID orgId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        organizationService.leave(orgId, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
