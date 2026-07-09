package com.gnosis.service;

import com.gnosis.domain.*;
import com.gnosis.dto.*;
import com.gnosis.exception.BadRequestException;
import com.gnosis.exception.ConflictException;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class MindService {

    private final MindRepository mindRepository;
    private final MindMembershipRepository mindMembershipRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    public MindService(MindRepository mindRepository,
                       MindMembershipRepository mindMembershipRepository,
                       OrganizationRepository organizationRepository,
                       UserRepository userRepository) {
        this.mindRepository = mindRepository;
        this.mindMembershipRepository = mindMembershipRepository;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public MindResponse create(UUID orgId, CreateMindRequest request, UUID userId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Mind mind = new Mind(org, request.name(), user);
        if (request.description() != null) mind.setDescription(request.description());
        if (request.storageQuotaMb() != null) mind.setStorageQuotaMb(request.storageQuotaMb());
        mind = mindRepository.save(mind);

        mindMembershipRepository.save(new MindMembership(mind, user, "ADMIN"));
        return MindResponse.from(mind);
    }

    public List<MindResponse> listByOrg(UUID orgId, UUID userId) {
        List<UUID> mindIds = mindMembershipRepository.findByUserId(userId).stream()
                .map(ms -> ms.getMind().getId())
                .toList();
        return mindRepository.findAllById(mindIds).stream()
                .filter(m -> m.getOrg().getId().equals(orgId) && m.getDeletedAt() == null)
                .map(MindResponse::from)
                .toList();
    }

    public MindResponse getById(UUID mindId) {
        Mind mind = mindRepository.findById(mindId)
                .orElseThrow(() -> new ResourceNotFoundException("Mind", mindId));
        if (mind.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Mind", mindId);
        }
        return MindResponse.from(mind);
    }

    @Transactional
    public MindResponse update(UUID mindId, UpdateMindRequest request) {
        Mind mind = mindRepository.findById(mindId)
                .orElseThrow(() -> new ResourceNotFoundException("Mind", mindId));
        if (request.name() != null) mind.setName(request.name());
        if (request.description() != null) mind.setDescription(request.description());
        if (request.storageQuotaMb() != null) mind.setStorageQuotaMb(request.storageQuotaMb());
        return MindResponse.from(mindRepository.save(mind));
    }

    @Transactional
    public void softDelete(UUID mindId) {
        Mind mind = mindRepository.findById(mindId)
                .orElseThrow(() -> new ResourceNotFoundException("Mind", mindId));
        mind.setDeletedAt(Instant.now());
        mindRepository.save(mind);
    }

    @Transactional(readOnly = true)
    public List<MindMemberResponse> listMembers(UUID mindId) {
        Mind mind = mindRepository.findById(mindId)
                .orElseThrow(() -> new ResourceNotFoundException("Mind", mindId));
        if (mind.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Mind", mindId);
        }
        return mindMembershipRepository.findByMindId(mindId).stream()
                .map(MindMemberResponse::from)
                .toList();
    }

    @Transactional
    public void updateMemberRole(UUID mindId, UUID memberUserId, String newRole) {
        MindMembership ms = mindMembershipRepository.findByMindIdAndUserId(mindId, memberUserId)
                .orElseThrow(() -> new ResourceNotFoundException("MindMembership", memberUserId));
        if (ms.getRole().equals("ADMIN") && !newRole.equals("ADMIN")) {
            long adminCount = mindMembershipRepository.findByUserId(ms.getUser().getId()).stream()
                    .filter(m -> m.getMind().getId().equals(mindId) && m.getRole().equals("ADMIN"))
                    .count();
            if (adminCount <= 1) {
                throw new ConflictException("Cannot remove the last admin");
            }
        }
        ms.setRole(newRole);
        mindMembershipRepository.save(ms);
    }

    @Transactional
    public void removeMember(UUID mindId, UUID memberUserId) {
        MindMembership ms = mindMembershipRepository.findByMindIdAndUserId(mindId, memberUserId)
                .orElseThrow(() -> new ResourceNotFoundException("MindMembership", memberUserId));
        if (ms.getRole().equals("ADMIN")) {
            throw new BadRequestException("Cannot remove an admin");
        }
        mindMembershipRepository.delete(ms);
    }
}
