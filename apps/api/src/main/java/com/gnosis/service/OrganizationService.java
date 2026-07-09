package com.gnosis.service;

import com.gnosis.domain.OrgMembership;
import com.gnosis.domain.Organization;
import com.gnosis.domain.User;
import com.gnosis.dto.OrgResponse;
import com.gnosis.exception.ConflictException;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.OrgMembershipRepository;
import com.gnosis.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrgMembershipRepository orgMembershipRepository;

    public OrganizationService(OrganizationRepository organizationRepository,
                               OrgMembershipRepository orgMembershipRepository) {
        this.organizationRepository = organizationRepository;
        this.orgMembershipRepository = orgMembershipRepository;
    }

    @Transactional
    public OrgResponse create(String name, User owner) {
        Organization org = organizationRepository.save(new Organization(name, owner));
        orgMembershipRepository.save(new OrgMembership(org, owner, "OWNER"));
        return OrgResponse.from(org);
    }

    @Transactional(readOnly = true)
    public List<OrgResponse> listByUser(UUID userId) {
        return orgMembershipRepository.findByUserId(userId).stream()
                .map(ms -> OrgResponse.from(ms.getOrg()))
                .toList();
    }

    public OrgResponse getById(UUID orgId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));
        return OrgResponse.from(org);
    }

    @Transactional
    public void removeMember(UUID orgId, UUID userId, UUID currentUserId) {
        OrgMembership membership = orgMembershipRepository.findByOrgIdAndUserId(orgId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("OrgMembership", userId));

        if (membership.getRole().equals("OWNER")) {
            throw new ConflictException("Cannot remove the owner of the organization");
        }

        if (currentUserId.equals(userId)) {
            throw new ConflictException("Cannot remove yourself");
        }

        orgMembershipRepository.delete(membership);
    }
}
