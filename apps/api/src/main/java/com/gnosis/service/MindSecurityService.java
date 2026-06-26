package com.gnosis.service;

import com.gnosis.domain.MindMembership;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.MindMembershipRepository;
import com.gnosis.util.SecurityUtils;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class MindSecurityService {

    private static final Map<String, Integer> ROLE_RANK = Map.of(
            "READ", 0,
            "READ_WRITE", 1,
            "ADMIN", 2
    );

    private final MindMembershipRepository mindMembershipRepository;

    public MindSecurityService(MindMembershipRepository mindMembershipRepository) {
        this.mindMembershipRepository = mindMembershipRepository;
    }

    public boolean hasMindRole(UUID mindId, String minimumRole) {
        UUID userId = SecurityUtils.getCurrentUserId();
        MindMembership ms = mindMembershipRepository.findByMindIdAndUserId(mindId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("MindMembership", mindId));
        return ROLE_RANK.getOrDefault(ms.getRole(), -1) >= ROLE_RANK.getOrDefault(minimumRole, -1);
    }

    public boolean isMindMember(UUID mindId) {
        try {
            return hasMindRole(mindId, "READ");
        } catch (ResourceNotFoundException e) {
            return false;
        }
    }
}
