package com.example.turtrackmanager.model.turtrack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "extras")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Extra {

    @Id
    @Column(name = "extra_id")
    private Long extraId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "enabled")
    private Boolean enabled;

    @Column(name = "extra_pricing_type")
    private String extraPricingType;

    @Column(name = "extra_type")
    private String extraType;

    @Column(name = "extra_category")
    private String extraCategory;

    @Column(name = "price")
    private Double price;

    @Column(name = "currency_code")
    private String currencyCode;

    @Column(name = "quantity")
    private Integer quantity;
}