package com.gnosis.controller;

import com.gnosis.domain.User;
import com.gnosis.dto.CreateOrgRequest;
import com.gnosis.dto.OrgResponse;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.UserRepository;
import com.gnosis.service.OrganizationService;
import com.gnosis.util.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;
    private final UserRepository userRepository;

    public OrganizationController(OrganizationService organizationService, UserRepository userRepository) {
        this.organizationService = organizationService;
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
        return ResponseEntity.ok(organizationService.getById(orgId));
    }

    @DeleteMapping("/{orgId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable UUID orgId, @PathVariable UUID userId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        organizationService.removeMember(orgId, userId, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
