package com.gnosis.controller;

import com.gnosis.dto.*;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.UserRepository;
import com.gnosis.service.MindSecurityService;
import com.gnosis.service.MindService;
import com.gnosis.util.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class MindController {

    private final MindService mindService;
    private final MindSecurityService mindSecurityService;
    private final UserRepository userRepository;

    public MindController(MindService mindService, MindSecurityService mindSecurityService,
                          UserRepository userRepository) {
        this.mindService = mindService;
        this.mindSecurityService = mindSecurityService;
        this.userRepository = userRepository;
    }

    @PostMapping("/organizations/{orgId}/minds")
    public ResponseEntity<MindResponse> create(@PathVariable UUID orgId,
                                               @Valid @RequestBody CreateMindRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mindService.create(orgId, request, userId));
    }

    @GetMapping("/organizations/{orgId}/minds")
    public ResponseEntity<List<MindResponse>> listByOrg(@PathVariable UUID orgId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(mindService.listByOrg(orgId, userId));
    }

    @GetMapping("/minds/{mindId}")
    public ResponseEntity<MindResponse> get(@PathVariable UUID mindId) {
        if (!mindSecurityService.isMindMember(mindId)) {
            throw new ResourceNotFoundException("Mind", mindId);
        }
        return ResponseEntity.ok(mindService.getById(mindId));
    }

    @PatchMapping("/minds/{mindId}")
    public ResponseEntity<MindResponse> update(@PathVariable UUID mindId,
                                                @Valid @RequestBody UpdateMindRequest request) {
        if (!mindSecurityService.hasMindRole(mindId, "ADMIN")) {
            throw new ResourceNotFoundException("Mind", mindId);
        }
        return ResponseEntity.ok(mindService.update(mindId, request));
    }

    @DeleteMapping("/minds/{mindId}")
    public ResponseEntity<Void> softDelete(@PathVariable UUID mindId) {
        if (!mindSecurityService.hasMindRole(mindId, "ADMIN")) {
            throw new ResourceNotFoundException("Mind", mindId);
        }
        mindService.softDelete(mindId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/minds/{mindId}/members")
    public ResponseEntity<List<MindMemberResponse>> listMembers(@PathVariable UUID mindId) {
        if (!mindSecurityService.isMindMember(mindId)) {
            throw new ResourceNotFoundException("Mind", mindId);
        }
        return ResponseEntity.ok(mindService.listMembers(mindId));
    }

    @PatchMapping("/minds/{mindId}/members/{userId}")
    public ResponseEntity<Void> updateMemberRole(@PathVariable UUID mindId,
                                                  @PathVariable UUID userId,
                                                  @Valid @RequestBody UpdateMemberRoleRequest request) {
        if (!mindSecurityService.hasMindRole(mindId, "ADMIN")) {
            throw new ResourceNotFoundException("Mind", mindId);
        }
        mindService.updateMemberRole(mindId, userId, request.role());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/minds/{mindId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable UUID mindId,
                                              @PathVariable UUID userId) {
        if (!mindSecurityService.hasMindRole(mindId, "ADMIN")) {
            throw new ResourceNotFoundException("Mind", mindId);
        }
        mindService.removeMember(mindId, userId);
        return ResponseEntity.noContent().build();
    }
}
