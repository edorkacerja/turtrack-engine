package com.example.turtrackmanager.model.turtrack;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(name = "daily_rate_and_availability")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DailyRateAndAvailability {

    @EmbeddedId
    private DailyRateAndAvailabilityId id;

    //    @ManyToOne(fetch = FetchType.LAZY)
    //    @MapsId("vehicleId")
    //    @JoinColumn(name = "vehicle_id")
    //    private Vehicle vehicle;

    @Column(name = "custom_set_price", nullable = false)
    private Boolean customSetPrice;

    @Column(name = "localizedDayOfWeek", nullable = false)
    private String localizedDayOfWeek;

    @Column(name = "price", nullable = false)
    private Double price;

    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;

    @Column(name = "whole_day_unavailable", nullable = false)
    private Boolean wholeDayUnavailable;

    @Embeddable
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DailyRateAndAvailabilityId implements Serializable {

        private Long vehicleId;
        private LocalDate date;
    }
}
