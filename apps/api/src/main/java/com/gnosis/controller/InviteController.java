package com.gnosis.controller;

import com.gnosis.dto.InviteRequest;
import com.gnosis.dto.InviteResponse;
import com.gnosis.service.MindInviteService;
import com.gnosis.service.MindSecurityService;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.UserRepository;
import com.gnosis.util.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class InviteController {

    private final MindInviteService mindInviteService;
    private final MindSecurityService mindSecurityService;
    private final UserRepository userRepository;

    public InviteController(MindInviteService mindInviteService, MindSecurityService mindSecurityService,
                            UserRepository userRepository) {
        this.mindInviteService = mindInviteService;
        this.mindSecurityService = mindSecurityService;
        this.userRepository = userRepository;
    }

    @PostMapping("/minds/{mindId}/invites")
    public ResponseEntity<InviteResponse> createInvite(@PathVariable UUID mindId,
                                                        @Valid @RequestBody InviteRequest request) {
        if (!mindSecurityService.hasMindRole(mindId, "ADMIN")) {
            throw new com.gnosis.exception.ResourceNotFoundException("Mind", mindId);
        }
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mindInviteService.createInvite(mindId, userId, request.inviteeEmail(), request.role()));
    }

    @PostMapping("/invites/accept")
    public ResponseEntity<Void> acceptInvite(@RequestBody Map<String, String> body) {
        UUID userId = SecurityUtils.getCurrentUserId();
        mindInviteService.acceptInvite(body.get("token"), userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/invites/decline")
    public ResponseEntity<Void> declineInvite(@RequestBody Map<String, String> body) {
        mindInviteService.declineInvite(body.get("token"));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/invites/pending")
    public ResponseEntity<List<InviteResponse>> listPending() {
        UUID userId = SecurityUtils.getCurrentUserId();
        String email = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId))
                .getEmail();
        return ResponseEntity.ok(mindInviteService.listPending(email));
    }
}
