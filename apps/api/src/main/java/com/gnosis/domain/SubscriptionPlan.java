package com.gnosis.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "amount_cents", nullable = false)
    private int amountCents;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private String interval;

    @Column(name = "max_orgs", nullable = false)
    private int maxOrgs;

    @Column(name = "max_minds_per_org", nullable = false)
    private int maxMindsPerOrg;

    @Column(name = "max_storage_mb_per_mind", nullable = false)
    private int maxStorageMbPerMind;

    @Column(name = "max_members_per_org", nullable = false)
    private int maxMembersPerOrg;

    @Column(name = "paystack_plan_code")
    private String paystackPlanCode;

    @Column(columnDefinition = "TEXT")
    private String features;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public SubscriptionPlan() {}

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAmountCents() { return amountCents; }
    public void setAmountCents(int amountCents) { this.amountCents = amountCents; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getInterval() { return interval; }
    public void setInterval(String interval) { this.interval = interval; }
    public int getMaxOrgs() { return maxOrgs; }
    public void setMaxOrgs(int maxOrgs) { this.maxOrgs = maxOrgs; }
    public int getMaxMindsPerOrg() { return maxMindsPerOrg; }
    public void setMaxMindsPerOrg(int maxMindsPerOrg) { this.maxMindsPerOrg = maxMindsPerOrg; }
    public int getMaxStorageMbPerMind() { return maxStorageMbPerMind; }
    public void setMaxStorageMbPerMind(int maxStorageMbPerMind) { this.maxStorageMbPerMind = maxStorageMbPerMind; }
    public int getMaxMembersPerOrg() { return maxMembersPerOrg; }
    public void setMaxMembersPerOrg(int maxMembersPerOrg) { this.maxMembersPerOrg = maxMembersPerOrg; }
    public String getPaystackPlanCode() { return paystackPlanCode; }
    public void setPaystackPlanCode(String paystackPlanCode) { this.paystackPlanCode = paystackPlanCode; }
    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public Instant getCreatedAt() { return createdAt; }
}
