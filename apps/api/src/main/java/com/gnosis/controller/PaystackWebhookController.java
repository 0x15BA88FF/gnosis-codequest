package com.gnosis.controller;

import com.gnosis.service.SubscriptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/webhooks")
public class PaystackWebhookController {

    private static final Logger log = LoggerFactory.getLogger(PaystackWebhookController.class);

    private final SubscriptionService subscriptionService;

    @Value("${paystack.webhook-secret:}")
    private String webhookSecret;

    public PaystackWebhookController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping("/paystack")
    public ResponseEntity<Map<String, String>> handleWebhook(
            @RequestBody String rawBody,
            @RequestHeader("x-paystack-signature") String signature) {

        if (webhookSecret != null && !webhookSecret.isBlank()) {
            if (!verifySignature(rawBody, signature, webhookSecret)) {
                log.warn("Invalid Paystack webhook signature");
                return ResponseEntity.status(401).body(Map.of("error", "Invalid signature"));
            }
        }

        try {
            Map<String, Object> payload = parseJson(rawBody);
            String event = (String) payload.get("event");

            if ("charge.success".equals(event)) {
                Map<String, Object> data = (Map<String, Object>) payload.get("data");
                if (data != null) {
                    String reference = (String) data.get("reference");
                    Map<String, Object> customer = (Map<String, Object>) data.get("customer");
                    String customerCode = customer != null ? (String) customer.get("customer_code") : null;

                    if (reference != null) {
                        log.info("Paystack charge.success: reference={}, customer={}", reference, customerCode);
                        subscriptionService.handleWebhookChargeSuccess(reference, customerCode);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error processing Paystack webhook", e);
        }

        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    private boolean verifySignature(String payload, String signature, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString().equals(signature);
        } catch (Exception e) {
            log.error("Error verifying webhook signature", e);
            return false;
        }
    }

    private Map<String, Object> parseJson(String json) {
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        try {
            String stripped = json.strip().replaceAll("^\\{|\\}$", "");
            parseJsonObject(stripped, result);
        } catch (Exception e) {
            log.error("Failed to parse webhook JSON", e);
        }
        return result;
    }

    private void parseJsonObject(String content, Map<String, Object> map) {
        if (content.isBlank()) return;
        int depth = 0;
        StringBuilder currentKey = new StringBuilder();
        StringBuilder currentValue = new StringBuilder();
        boolean inKey = true;
        boolean inString = false;

        for (int i = 0; i < content.length(); i++) {
            char c = content.charAt(i);

            if (c == '"' && (i == 0 || content.charAt(i - 1) != '\\')) {
                inString = !inString;
                if (inString && inKey) continue;
                if (!inString && inKey) {
                    currentKey.setLength(0);
                    inKey = false;
                    continue;
                }
                continue;
            }

            if (inString) {
                if (inKey) currentKey.append(c);
                else currentValue.append(c);
                continue;
            }

            if (c == '{') {
                depth++;
                currentValue.append(c);
            } else if (c == '}') {
                depth--;
                currentValue.append(c);
            } else if (c == ',' && depth == 0) {
                addParsedEntry(map, currentKey.toString().trim(), currentValue.toString().trim());
                currentKey.setLength(0);
                currentValue.setLength(0);
                inKey = true;
            } else {
                currentValue.append(c);
            }
        }
        if (!currentKey.isEmpty() || !currentValue.isEmpty()) {
            addParsedEntry(map, currentKey.toString().trim(), currentValue.toString().trim());
        }
    }

    private void addParsedEntry(Map<String, Object> map, String key, String value) {
        if (key.isEmpty()) return;
        key = key.replace("\"", "");
        value = value.replace("\"", "");

        if ("true".equals(value)) map.put(key, Boolean.TRUE);
        else if ("false".equals(value)) map.put(key, Boolean.FALSE);
        else if ("null".equals(value)) map.put(key, null);
        else map.put(key, value);
    }
}
