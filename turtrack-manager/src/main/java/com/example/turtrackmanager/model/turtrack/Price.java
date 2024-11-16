package com.example.turtrackmanager.model.turtrack;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "prices")
@Data
@NoArgsConstructor
public class Price {
    @Id
    private String id;  // Stripe price ID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false)
    private String interval;  // month, year, week

    private boolean active = true;

    // Useful for optimistic locking
    @Version
    private Long version;
}