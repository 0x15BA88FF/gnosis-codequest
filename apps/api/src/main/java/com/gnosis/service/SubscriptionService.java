package com.gnosis.service;

import com.gnosis.domain.*;
import com.gnosis.exception.BadRequestException;
import com.gnosis.exception.ResourceNotFoundException;
import com.gnosis.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class SubscriptionService {

    private static final String PAYSTACK_BASE_URL = "https://api.paystack.co";
    private static final int UNLIMITED = -1;

    private final SubscriptionPlanRepository planRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final OrgMembershipRepository orgMembershipRepository;
    private final MindRepository mindRepository;
    private final UserRepository userRepository;

    @Value("${paystack.secret-key}")
    private String paystackSecretKey;

    private final RestClient restClient;

    public SubscriptionService(SubscriptionPlanRepository planRepository,
                               UserSubscriptionRepository subscriptionRepository,
                               PaymentTransactionRepository transactionRepository,
                               OrgMembershipRepository orgMembershipRepository,
                               MindRepository mindRepository,
                               UserRepository userRepository) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.transactionRepository = transactionRepository;
        this.orgMembershipRepository = orgMembershipRepository;
        this.mindRepository = mindRepository;
        this.userRepository = userRepository;
        this.restClient = RestClient.builder().baseUrl(PAYSTACK_BASE_URL).build();
    }

    @Transactional(readOnly = true)
    public List<SubscriptionPlan> listPlans() {
        return planRepository.findAllByOrderBySortOrderAsc();
    }

    @Transactional(readOnly = true)
    public SubscriptionPlan getCurrentPlan(UUID userId) {
        return subscriptionRepository.findByUserId(userId)
                .filter(s -> UserSubscription.STATUS_ACTIVE.equals(s.getStatus()) ||
                             UserSubscription.STATUS_PAST_DUE.equals(s.getStatus()))
                .map(UserSubscription::getPlan)
                .orElseGet(() -> planRepository.findByCode("free")
                        .orElseThrow(() -> new RuntimeException("Free plan not found")));
    }

    @Transactional(readOnly = true)
    public UserSubscription getCurrentSubscription(UUID userId) {
        return subscriptionRepository.findByUserId(userId).orElse(null);
    }

    @Transactional(readOnly = true)
    public boolean canCreateOrg(UUID userId) {
        SubscriptionPlan plan = getCurrentPlan(userId);
        if (plan.getMaxOrgs() == UNLIMITED) return true;
        long currentCount = countOrgsForUser(userId);
        return currentCount < plan.getMaxOrgs();
    }

    @Transactional(readOnly = true)
    public boolean canCreateMind(UUID userId, UUID orgId) {
        SubscriptionPlan plan = getCurrentPlan(userId);
        if (plan.getMaxMindsPerOrg() == UNLIMITED) return true;
        long currentCount = mindRepository.countByOrgId(orgId);
        return currentCount < plan.getMaxMindsPerOrg();
    }

    @Transactional(readOnly = true)
    public long getOrgCount(UUID userId) {
        return countOrgsForUser(userId);
    }

    @Transactional(readOnly = true)
    public long getMindCount(UUID orgId) {
        return mindRepository.countByOrgId(orgId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getUsage(UUID userId) {
        SubscriptionPlan plan = getCurrentPlan(userId);
        long orgCount = countOrgsForUser(userId);

        List<OrgMembership> memberships = orgMembershipRepository.findByUserId(userId);
        Map<String, Object> usage = new LinkedHashMap<>();
        usage.put("orgCount", orgCount);
        usage.put("maxOrgs", plan.getMaxOrgs());
        usage.put("planCode", plan.getCode());
        usage.put("planName", plan.getName());
        usage.put("mindsPerOrg", new LinkedHashMap<>());

        for (OrgMembership ms : memberships) {
            UUID orgId = ms.getOrg().getId();
            long mindCount = mindRepository.countByOrgId(orgId);
            Map<String, Object> orgMind = new LinkedHashMap<>();
            orgMind.put("count", mindCount);
            orgMind.put("max", plan.getMaxMindsPerOrg());
            orgMind.put("orgName", ms.getOrg().getName());
            @SuppressWarnings("unchecked")
            Map<String, Object> mindsPerOrg = (Map<String, Object>) usage.get("mindsPerOrg");
            mindsPerOrg.put(orgId.toString(), orgMind);
        }
        return usage;
    }

    @Transactional
    public Map<String, Object> initializeCheckout(UUID userId, String planCode) {
        SubscriptionPlan plan = planRepository.findByCode(planCode)
                .orElseThrow(() -> new ResourceNotFoundException("Plan", planCode));

        if ("free".equals(planCode)) {
            activateFreePlan(userId);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("accessCode", null);
            result.put("authorizationUrl", null);
            result.put("reference", null);
            result.put("free", true);
            return result;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        String reference = "gnosis_" + UUID.randomUUID().toString().substring(0, 8) + "_" + System.currentTimeMillis();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", user.getEmail());
        body.put("amount", plan.getAmountCents());
        body.put("currency", plan.getCurrency());
        body.put("reference", reference);
        body.put("channels", List.of("card", "mobile_money"));

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("user_id", userId.toString());
        metadata.put("plan_code", planCode);
        body.put("metadata", metadata);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(paystackSecretKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response;
        try {
            response = restClient.post()
                    .uri("/transaction/initialize")
                    .headers(h -> {
                        h.setContentType(MediaType.APPLICATION_JSON);
                        h.setBearerAuth(paystackSecretKey);
                    })
                    .body(body)
                    .retrieve()
                    .toEntity(Map.class);
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            String detail = e.getResponseBodyAsString();
            throw new BadRequestException("Payment gateway error: " + (detail != null && !detail.isBlank() ? detail : e.getStatusText()));
        }

        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null || !(Boolean) responseBody.get("status")) {
            throw new BadRequestException("Failed to initialize payment with Paystack");
        }

        Map<String, Object> responseData = (Map<String, Object>) responseBody.get("data");

        PaymentTransaction txn = new PaymentTransaction(user, plan, reference, plan.getAmountCents(), plan.getCurrency());
        txn.setMetadata("{\"paystack_access_code\":\"" + responseData.get("access_code") + "\",\"plan_code\":\"" + planCode + "\"}");
        transactionRepository.save(txn);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("accessCode", responseData.get("access_code"));
        result.put("authorizationUrl", responseData.get("authorization_url"));
        result.put("reference", reference);
        result.put("free", false);
        return result;
    }

    @Transactional
    public UserSubscription verifyAndActivate(UUID userId, String paystackReference) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(paystackSecretKey);

        ResponseEntity<Map> response;
        try {
            response = restClient.get()
                    .uri("/transaction/verify/{reference}", paystackReference)
                    .headers(h -> h.setBearerAuth(paystackSecretKey))
                    .retrieve()
                    .toEntity(Map.class);
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            throw new BadRequestException("Payment verification failed: " + e.getStatusText());
        }

        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null || !(Boolean) responseBody.get("status")) {
            throw new BadRequestException("Failed to verify transaction");
        }

        Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
        String status = (String) data.get("status");

        PaymentTransaction txn = transactionRepository.findByPaystackReference(paystackReference)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", paystackReference));

        if (!"success".equals(status)) {
            txn.setStatus(PaymentTransaction.STATUS_FAILED);
            transactionRepository.save(txn);
            throw new BadRequestException("Payment was not successful: " + status);
        }

        txn.setStatus(PaymentTransaction.STATUS_SUCCESS);
        txn.setChannel((String) data.get("channel"));
        txn.setPaidAt(Instant.now());

        Map<String, Object> metadata = txn.getMetadata() != null ? parseMetadata(txn.getMetadata()) : new LinkedHashMap<>();
        String resolvedPlanCode = (String) metadata.get("plan_code");
        if (resolvedPlanCode == null) resolvedPlanCode = txn.getPlan().getCode();
        final String planCode = resolvedPlanCode;

        SubscriptionPlan plan = planRepository.findByCode(planCode)
                .orElseThrow(() -> new ResourceNotFoundException("Plan", planCode));

        User user = txn.getUser();

        UserSubscription existingSub = subscriptionRepository.findByUserId(user.getId()).orElse(null);

        UserSubscription sub;
        if (existingSub != null) {
            sub = existingSub;
            sub.setPlan(plan);
            sub.setStatus(UserSubscription.STATUS_ACTIVE);
        } else {
            sub = new UserSubscription(user, plan);
        }

        Map<String, Object> customerData = (Map<String, Object>) data.get("customer");
        if (customerData != null) {
            sub.setPaystackCustomerCode((String) customerData.get("customer_code"));
        }

        Map<String, Object> authData = (Map<String, Object>) data.get("authorization");
        if (authData != null) {
            sub.setPaystackAuthorizationCode((String) authData.get("authorization_code"));
        }

        sub.setCurrentPeriodStart(Instant.now());
        sub.setCurrentPeriodEnd(Instant.now().plus(30, ChronoUnit.DAYS));
        sub.setCancelAtPeriodEnd(false);

        subscriptionRepository.save(sub);

        txn.setSubscription(sub);
        transactionRepository.save(txn);

        return sub;
    }

    @Transactional
    public void handleWebhookChargeSuccess(String paystackReference, String customerCode) {
        PaymentTransaction txn = transactionRepository.findByPaystackReference(paystackReference).orElse(null);
        if (txn == null || PaymentTransaction.STATUS_SUCCESS.equals(txn.getStatus())) {
            return;
        }

        verifyAndActivate(txn.getUser().getId(), paystackReference);
    }

    @Transactional
    public void cancelSubscription(UUID userId) {
        UserSubscription sub = subscriptionRepository.findByUserId(userId)
                .filter(s -> UserSubscription.STATUS_ACTIVE.equals(s.getStatus()))
                .orElseThrow(() -> new ResourceNotFoundException("Active subscription", userId));

        sub.setCancelAtPeriodEnd(true);
        sub.setStatus(UserSubscription.STATUS_CANCELLED);
        subscriptionRepository.save(sub);
    }

    @Transactional
    public List<PaymentTransaction> getTransactions(UUID userId) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    private void activateFreePlan(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        SubscriptionPlan freePlan = planRepository.findByCode("free")
                .orElseThrow(() -> new RuntimeException("Free plan not found"));

        UserSubscription existing = subscriptionRepository.findByUserId(userId).orElse(null);
        if (existing == null) {
            UserSubscription sub = new UserSubscription(user, freePlan);
            sub.setCurrentPeriodStart(Instant.now());
            subscriptionRepository.save(sub);
        }
    }

    private long countOrgsForUser(UUID userId) {
        return orgMembershipRepository.findByUserId(userId).stream()
                .filter(ms -> OrgMembership.ROLE_OWNER.equals(ms.getRole()))
                .count();
    }

    private Map<String, Object> parseMetadata(String json) {
        Map<String, Object> map = new LinkedHashMap<>();
        if (json == null || json.isBlank()) return map;
        try {
            String stripped = json.replaceAll("^\\{|\\}$", "");
            if (stripped.isBlank()) return map;
            for (String pair : stripped.split(",")) {
                String[] kv = pair.split(":", 2);
                if (kv.length == 2) {
                    String key = kv[0].trim().replace("\"", "");
                    String val = kv[1].trim().replace("\"", "");
                    map.put(key, val);
                }
            }
        } catch (Exception ignored) {}
        return map;
    }
}
