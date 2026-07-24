package com.gnosis.controller;

import com.gnosis.dto.OrgInviteResponse;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.UserRepository;
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
@RequestMapping("/api/v1")
public class OrgInviteController {

    private final OrgInviteService orgInviteService;
    private final UserRepository userRepository;

    public OrgInviteController(OrgInviteService orgInviteService, UserRepository userRepository) {
        this.orgInviteService = orgInviteService;
        this.userRepository = userRepository;
    }

    @PostMapping("/invites/accept")
    public ResponseEntity<Void> acceptInvite(@RequestBody Map<String, String> body) {
        UUID userId = SecurityUtils.getCurrentUserId();
        orgInviteService.acceptInvite(body.get("token"), userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/invites/decline")
    public ResponseEntity<Void> declineInvite(@RequestBody Map<String, String> body) {
        orgInviteService.declineInvite(body.get("token"));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/invites/pending")
    public ResponseEntity<List<OrgInviteResponse>> listPending() {
        UUID userId = SecurityUtils.getCurrentUserId();
        String email = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId))
                .getEmail();
        return ResponseEntity.ok(orgInviteService.listPendingByEmail(email));
    }
}