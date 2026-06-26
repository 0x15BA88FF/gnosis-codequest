package com.gnosis.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "org_memberships", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"org_id", "user_id"})
})
public class OrgMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization org;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String role;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    public OrgMembership() {}

    public OrgMembership(Organization org, User user, String role) {
        this.org = org;
        this.user = user;
        this.role = role;
    }

    @PrePersist
    protected void onCreate() {
        joinedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Organization getOrg() { return org; }
    public void setOrg(Organization org) { this.org = org; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Instant getJoinedAt() { return joinedAt; }
}
