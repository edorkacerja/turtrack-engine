package com.turtrack.dataprocessorservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyRateAndAvailability {
    private Long vehicleId;
    private LocalDate date;
    private Boolean custom;
    private String localizedDayOfWeek;
    private String localizedShortDayOfWeek;
    private Double price;
    private Boolean priceEditable;
    private String currencyCode;
    private String source;
    private Boolean wholeDayUnavailable;
}