package com.gnosis.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mind_memberships", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"mind_id", "user_id"})
})
public class MindMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mind_id", nullable = false)
    private Mind mind;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String role;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    public MindMembership() {}

    public MindMembership(Mind mind, User user, String role) {
        this.mind = mind;
        this.user = user;
        this.role = role;
    }

    @PrePersist
    protected void onCreate() {
        joinedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Mind getMind() { return mind; }
    public void setMind(Mind mind) { this.mind = mind; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Instant getJoinedAt() { return joinedAt; }
}
