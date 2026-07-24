package com.gnosis.dto;

import com.gnosis.domain.SubscriptionPlan;

import java.util.List;

public record PlanResponse(
        String code,
        String name,
        int amountCents,
        String currency,
        String interval,
        int maxOrgs,
        int maxMindsPerOrg,
        int maxStorageMbPerMind,
        int maxMembersPerOrg,
        List<String> features,
        int sortOrder
) {
    public static PlanResponse from(SubscriptionPlan plan) {
        List<String> featureList = List.of();
        if (plan.getFeatures() != null && !plan.getFeatures().isBlank()) {
            String raw = plan.getFeatures().replaceAll("^\\[|\\]$", "");
            featureList = List.of(raw.split(","));
        }
        return new PlanResponse(
                plan.getCode(),
                plan.getName(),
                plan.getAmountCents(),
                plan.getCurrency(),
                plan.getInterval(),
                plan.getMaxOrgs(),
                plan.getMaxMindsPerOrg(),
                plan.getMaxStorageMbPerMind(),
                plan.getMaxMembersPerOrg(),
                featureList.stream().map(String::trim).map(s -> s.replace("\"", "")).toList(),
                plan.getSortOrder()
        );
    }
}
