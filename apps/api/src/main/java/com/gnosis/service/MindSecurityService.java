package com.gnosis.service;

import com.gnosis.domain.Mind;
import com.gnosis.domain.MindMembership;
import com.gnosis.domain.OrgMembership;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.MindMembershipRepository;
import com.gnosis.repository.MindRepository;
import com.gnosis.repository.OrgMembershipRepository;
import com.gnosis.util.SecurityUtils;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class MindSecurityService {

    private static final Map<String, Integer> ROLE_RANK = Map.of(
            "NONE", -1,
            "READ", 0,
            "READ_WRITE", 1,
            "ADMIN", 2
    );

    private final MindMembershipRepository mindMembershipRepository;
    private final OrgMembershipRepository orgMembershipRepository;
    private final MindRepository mindRepository;

    public MindSecurityService(MindMembershipRepository mindMembershipRepository,
                               OrgMembershipRepository orgMembershipRepository,
                               MindRepository mindRepository) {
        this.mindMembershipRepository = mindMembershipRepository;
        this.orgMembershipRepository = orgMembershipRepository;
        this.mindRepository = mindRepository;
    }

    public boolean hasMindRole(UUID mindId, String minimumRole) {
        UUID userId = SecurityUtils.getCurrentUserId();
        Mind mind = mindRepository.findById(mindId)
                .orElseThrow(() -> new ResourceNotFoundException("Mind", mindId));

        OrgMembership orgMembership = orgMembershipRepository.findByOrgIdAndUserId(mind.getOrg().getId(), userId)
                .orElse(null);

        String effectiveRole;
        if (orgMembership != null &&
            (orgMembership.getRole().equals(OrgMembership.ROLE_OWNER) ||
             orgMembership.getRole().equals(OrgMembership.ROLE_ADMIN))) {
            effectiveRole = "ADMIN";
        } else {
            effectiveRole = mindMembershipRepository.findByMindIdAndUserId(mindId, userId)
                    .map(MindMembership::getRole)
                    .orElse("NONE");
        }

        return ROLE_RANK.getOrDefault(effectiveRole, -1) >= ROLE_RANK.getOrDefault(minimumRole, -1);
    }

    public boolean isMindMember(UUID mindId) {
        try {
            return hasMindRole(mindId, "READ");
        } catch (ResourceNotFoundException e) {
            return false;
        }
    }
}