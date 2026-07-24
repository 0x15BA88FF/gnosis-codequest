package com.gnosis.dto;

import com.gnosis.domain.SubscriptionPlan;
import com.gnosis.domain.UserSubscription;

import java.time.Instant;
import java.util.UUID;

public record SubscriptionResponse(
        UUID id,
        String planCode,
        String planName,
        int amountCents,
        String currency,
        String status,
        Instant currentPeriodEnd,
        boolean cancelAtPeriodEnd,
        int maxOrgs,
        int maxMindsPerOrg,
        int maxStorageMbPerMind,
        int maxMembersPerOrg
) {
    public static SubscriptionResponse from(UserSubscription sub) {
        SubscriptionPlan plan = sub.getPlan();
        return new SubscriptionResponse(
                sub.getId(),
                plan.getCode(),
                plan.getName(),
                plan.getAmountCents(),
                plan.getCurrency(),
                sub.getStatus(),
                sub.getCurrentPeriodEnd(),
                sub.isCancelAtPeriodEnd(),
                plan.getMaxOrgs(),
                plan.getMaxMindsPerOrg(),
                plan.getMaxStorageMbPerMind(),
                plan.getMaxMembersPerOrg()
        );
    }
}
