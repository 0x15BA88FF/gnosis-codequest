package com.gnosis.repository;

import com.gnosis.domain.Notification;
import com.gnosis.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class NotificationRepositoryTest {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByUserIdAndReadFalse() {
        User user = userRepository.save(new User("pat@example.com", "hash", "Pat"));
        Notification n1 = new Notification(user, "INVITE", "You're invited!");
        n1.setRead(true);
        Notification n2 = new Notification(user, "INVITE", "Another invite");
        notificationRepository.save(n1);
        notificationRepository.save(n2);

        List<Notification> unread = notificationRepository.findByUserIdAndReadFalse(user.getId());
        assertThat(unread).hasSize(1);
        assertThat(unread.get(0).getTitle()).isEqualTo("Another invite");
    }
}
