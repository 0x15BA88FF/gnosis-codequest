package com.gnosis.repository;

import com.gnosis.domain.UserSubscription;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, UUID> {
    @EntityGraph(attributePaths = {"plan"})
    Optional<UserSubscription> findByUserId(UUID userId);
    Optional<UserSubscription> findByPaystackSubscriptionCode(String code);
    Optional<UserSubscription> findByPaystackCustomerCode(String customerCode);
}
