package com.gnosis.service;

import com.gnosis.domain.Notification;
import com.gnosis.domain.User;
import com.gnosis.dto.NotificationResponse;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification create(User user, String type, String title, String body, String payload) {
        Notification n = new Notification(user, type, title);
        n.setBody(body);
        n.setPayload(payload);
        return notificationRepository.save(n);
    }

    public Page<NotificationResponse> listByUser(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationResponse::from);
    }

    @Transactional
    public void markRead(UUID notificationId, UUID userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));
        if (!n.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Notification", notificationId);
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.findByUserIdAndReadFalse(userId)
                .forEach(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                });
    }
}
