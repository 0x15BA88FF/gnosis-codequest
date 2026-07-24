package com.gnosis.controller;

import com.gnosis.domain.User;
import com.gnosis.dto.*;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.UserRepository;
import com.gnosis.service.SubscriptionService;
import com.gnosis.util.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final UserRepository userRepository;

    public SubscriptionController(SubscriptionService subscriptionService,
                                  UserRepository userRepository) {
        this.subscriptionService = subscriptionService;
        this.userRepository = userRepository;
    }

    @GetMapping("/plans")
    public ResponseEntity<List<PlanResponse>> listPlans() {
        List<PlanResponse> plans = subscriptionService.listPlans().stream()
                .map(PlanResponse::from)
                .toList();
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> getCurrent() {
        UUID userId = SecurityUtils.getCurrentUserId();
        var sub = subscriptionService.getCurrentSubscription(userId);
        var plan = subscriptionService.getCurrentPlan(userId);

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("plan", PlanResponse.from(plan));
        if (sub != null) {
            result.put("subscription", SubscriptionResponse.from(sub));
        } else {
            result.put("subscription", null);
        }
        result.put("usage", subscriptionService.getUsage(userId));
        return ResponseEntity.ok(result);
    }

    @PostMapping("/checkout")
    public ResponseEntity<Map<String, Object>> checkout(@Valid @RequestBody CheckoutRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        Map<String, Object> result = subscriptionService.initializeCheckout(userId, request.planCode());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/verify")
    public ResponseEntity<SubscriptionResponse> verify(@Valid @RequestBody VerifyRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        var sub = subscriptionService.verifyAndActivate(userId, request.reference());
        return ResponseEntity.ok(SubscriptionResponse.from(sub));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<Map<String, Object>>> getTransactions() {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<Map<String, Object>> transactions = subscriptionService.getTransactions(userId).stream()
                .map(txn -> {
                    Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("id", txn.getId());
                    map.put("amountCents", txn.getAmountCents());
                    map.put("currency", txn.getCurrency());
                    map.put("status", txn.getStatus());
                    map.put("channel", txn.getChannel());
                    map.put("paidAt", txn.getPaidAt());
                    map.put("createdAt", txn.getCreatedAt());
                    map.put("planName", txn.getPlan().getName());
                    return map;
                })
                .toList();
        return ResponseEntity.ok(transactions);
    }

    @DeleteMapping("/current")
    public ResponseEntity<Void> cancel() {
        UUID userId = SecurityUtils.getCurrentUserId();
        subscriptionService.cancelSubscription(userId);
        return ResponseEntity.noContent().build();
    }
}
