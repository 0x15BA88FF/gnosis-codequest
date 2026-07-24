package com.gnosis.repository;

import com.gnosis.domain.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {
    Optional<PaymentTransaction> findByPaystackReference(String reference);
    List<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
