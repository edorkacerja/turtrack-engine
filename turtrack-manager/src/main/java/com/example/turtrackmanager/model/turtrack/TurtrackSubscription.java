package com.example.turtrackmanager.model.turtrack;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "turtrack_subscriptions")
public class TurtrackSubscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerId;  // Stripe customer ID

    @Column(nullable = false, unique = true)
    private String subscriptionId;  // Stripe subscription ID

    @Column(nullable = false)
    private String status;  // active, canceled, etc.

    @Column(nullable = false)
    private String priceId;  // Stripe price ID

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}