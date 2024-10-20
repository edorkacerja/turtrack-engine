package com.example.turtrackmanager.model.turtrack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.Objects;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "extras", indexes = {
        @Index(name = "idx_extra_external_id", columnList = "external_id")
})
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Extra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", unique = true)
    private Long externalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "description", length = 5000)
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Extra)) return false;
        Extra extra = (Extra) o;
        return Objects.equals(externalId, extra.externalId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(externalId);
    }

}
