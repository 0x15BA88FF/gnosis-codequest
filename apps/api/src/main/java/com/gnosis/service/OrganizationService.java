package com.gnosis.service;

import com.gnosis.domain.*;
import com.gnosis.dto.OrgMemberResponse;
import com.gnosis.dto.OrgResponse;
import com.gnosis.exception.BadRequestException;
import com.gnosis.exception.ConflictException;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrgMembershipRepository orgMembershipRepository;
    private final MindRepository mindRepository;
    private final DocumentRepository documentRepository;
    private final ChunkRepository chunkRepository;
    private final MindMembershipRepository mindMembershipRepository;
    private final SubscriptionService subscriptionService;

    public OrganizationService(OrganizationRepository organizationRepository,
                               OrgMembershipRepository orgMembershipRepository,
                               MindRepository mindRepository,
                               DocumentRepository documentRepository,
                               ChunkRepository chunkRepository,
                               MindMembershipRepository mindMembershipRepository,
                               SubscriptionService subscriptionService) {
        this.organizationRepository = organizationRepository;
        this.orgMembershipRepository = orgMembershipRepository;
        this.mindRepository = mindRepository;
        this.documentRepository = documentRepository;
        this.chunkRepository = chunkRepository;
        this.mindMembershipRepository = mindMembershipRepository;
        this.subscriptionService = subscriptionService;
    }

    @Transactional
    public OrgResponse create(String name, User owner) {
        if (!subscriptionService.canCreateOrg(owner.getId())) {
            throw new BadRequestException(
                "Organization limit reached for your current plan. Please upgrade to create more organizations.");
        }

        Organization org = organizationRepository.save(new Organization(name, owner));
        OrgMembership membership = new OrgMembership(org, owner, OrgMembership.ROLE_OWNER);
        orgMembershipRepository.save(membership);
        return OrgResponse.from(org, 1, 0, OrgMembership.ROLE_OWNER);
    }

    @Transactional(readOnly = true)
    public List<OrgResponse> listByUser(UUID userId) {
        return orgMembershipRepository.findByUserId(userId).stream()
                .map(ms -> {
                    Organization org = ms.getOrg();
                    long memberCount = orgMembershipRepository.countByOrgId(org.getId());
                    long mindCount = mindRepository.countByOrgId(org.getId());
                    return OrgResponse.from(org, memberCount, mindCount, ms.getRole());
                })
                .toList();
    }

public OrgResponse getById(UUID orgId, UUID currentUserId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));

        OrgMembership membership = orgMembershipRepository.findByOrgIdAndUserId(orgId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));

        long memberCount = orgMembershipRepository.countByOrgId(orgId);
        long mindCount = mindRepository.countByOrgId(orgId);
        return OrgResponse.from(org, memberCount, mindCount, membership.getRole());
    }

    @Transactional
    public OrgResponse rename(UUID orgId, String name, UUID currentUserId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));

        OrgMembership membership = orgMembershipRepository.findByOrgIdAndUserId(orgId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("OrgMembership", currentUserId));

        if (!membership.getRole().equals(OrgMembership.ROLE_OWNER)) {
            throw new ConflictException("Only the owner can rename the organization");
        }

        org.setName(name);
        organizationRepository.save(org);

        long memberCount = orgMembershipRepository.countByOrgId(orgId);
        long mindCount = mindRepository.countByOrgId(orgId);
        return OrgResponse.from(org, memberCount, mindCount, membership.getRole());
    }

    @Transactional
    public void removeMember(UUID orgId, UUID userId, UUID currentUserId) {
        OrgMembership membership = orgMembershipRepository.findByOrgIdAndUserId(orgId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("OrgMembership", userId));

        if (membership.getRole().equals(OrgMembership.ROLE_OWNER)) {
            throw new ConflictException("Cannot remove the owner of the organization");
        }

        if (currentUserId.equals(userId)) {
            throw new ConflictException("Cannot remove yourself");
        }

        OrgMembership currentMembership = orgMembershipRepository.findByOrgIdAndUserId(orgId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("OrgMembership", currentUserId));

        if (!currentMembership.getRole().equals(OrgMembership.ROLE_OWNER) &&
            !currentMembership.getRole().equals(OrgMembership.ROLE_ADMIN)) {
            throw new ConflictException("Only owner or admin can remove members");
        }

        mindMembershipRepository.deleteByUserIdAndMindOrgId(userId, orgId);
        orgMembershipRepository.delete(membership);
    }

    @Transactional
    public void delete(UUID orgId, UUID currentUserId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));

        if (!org.getOwner().getId().equals(currentUserId)) {
            throw new ConflictException("Only the owner can delete this organization");
        }

        chunkRepository.deleteByOrgId(orgId);
        documentRepository.deleteByOrgId(orgId);
        mindRepository.deleteByOrgId(orgId);
        orgMembershipRepository.deleteByOrgId(orgId);
        organizationRepository.delete(org);
    }

    @Transactional
    public void leave(UUID orgId, UUID currentUserId) {
        OrgMembership membership = orgMembershipRepository.findByOrgIdAndUserId(orgId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("OrgMembership", currentUserId));

        if (membership.getRole().equals(OrgMembership.ROLE_OWNER)) {
            throw new ConflictException("Owner cannot leave the organization");
        }

        mindMembershipRepository.deleteByUserIdAndMindOrgId(currentUserId, orgId);
        orgMembershipRepository.delete(membership);
    }

    @Transactional(readOnly = true)
    public List<OrgMemberResponse> listMembers(UUID orgId, UUID currentUserId) {
        OrgMembership currentMembership = orgMembershipRepository.findByOrgIdAndUserId(orgId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("OrgMembership", currentUserId));

        if (!currentMembership.getRole().equals(OrgMembership.ROLE_OWNER) &&
            !currentMembership.getRole().equals(OrgMembership.ROLE_ADMIN)) {
            throw new ConflictException("Only owners and admins can list members");
        }

        List<OrgMembership> memberships = orgMembershipRepository.findByOrgId(orgId);
        return memberships.stream().map(ms -> {
            Map<UUID, String> mindAccess = mindMembershipRepository.findByUserIdAndMindOrgId(ms.getUser().getId(), orgId).stream()
                    .collect(Collectors.toMap(
                            m -> m.getMind().getId(),
                            MindMembership::getRole
                    ));
            return OrgMemberResponse.from(ms, mindAccess);
        }).toList();
    }

    @Transactional
    public OrgMemberResponse manageMember(UUID orgId, UUID userId, UUID currentUserId,
                                           String role, Map<UUID, String> mindAccess) {
        OrgMembership currentMembership = orgMembershipRepository.findByOrgIdAndUserId(orgId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("OrgMembership", currentUserId));

        if (!currentMembership.getRole().equals(OrgMembership.ROLE_OWNER) &&
            !currentMembership.getRole().equals(OrgMembership.ROLE_ADMIN)) {
            throw new ConflictException("Only owners and admins can manage members");
        }

        OrgMembership targetMembership = orgMembershipRepository.findByOrgIdAndUserId(orgId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("OrgMembership", userId));

        if (targetMembership.getRole().equals(OrgMembership.ROLE_OWNER)) {
            throw new ConflictException("Cannot modify the organization owner");
        }

        if (role != null) {
            if (!role.equals(OrgMembership.ROLE_MEMBER) && !role.equals(OrgMembership.ROLE_ADMIN)) {
                throw new ConflictException("Invalid role");
            }
            targetMembership.setRole(role);
            orgMembershipRepository.save(targetMembership);
        }

        if (mindAccess != null) {
            for (Map.Entry<UUID, String> entry : mindAccess.entrySet()) {
                UUID mindId = entry.getKey();
                String mindRole = entry.getValue();

                if ("NONE".equalsIgnoreCase(mindRole)) {
                    mindMembershipRepository.findByMindIdAndUserId(mindId, userId)
                            .ifPresent(mindMembershipRepository::delete);
                } else {
                    MindMembership mm = mindMembershipRepository.findByMindIdAndUserId(mindId, userId)
                            .orElseGet(() -> {
                                Mind mind = mindRepository.findById(mindId)
                                        .orElseThrow(() -> new ResourceNotFoundException("Mind", mindId));
                                return new MindMembership(mind, targetMembership.getUser(), mindRole);
                            });
                    mm.setRole(mindRole);
                    mindMembershipRepository.save(mm);
                }
            }
        }

        Map<UUID, String> updatedMindAccess = mindMembershipRepository.findByUserIdAndMindOrgId(userId, orgId).stream()
                .collect(Collectors.toMap(
                        m -> m.getMind().getId(),
                        MindMembership::getRole
                ));

        return OrgMemberResponse.from(targetMembership, updatedMindAccess);
    }
}