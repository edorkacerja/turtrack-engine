package com.example.turtrackmanager.dto;

import com.example.turtrackmanager.model.turtrack.DailyRateAndAvailability;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyRateAndAvailabilityDTO {
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

    public DailyRateAndAvailabilityDTO toDTO(DailyRateAndAvailability entity) {
        if (entity == null) {
            return null;
        }

        return DailyRateAndAvailabilityDTO.builder()
                .vehicleId(entity.getId().getVehicleId())
                .date(entity.getId().getDate())
                .custom(entity.getCustomSetPrice())
                .localizedDayOfWeek(entity.getLocalizedDayOfWeek())
//                .localizedShortDayOfWeek(entity.getLocalizedShortDayOfWeek())
                .price(entity.getPrice())
//                .priceEditable(entity.getPriceEditable())
                .currencyCode(entity.getCurrencyCode())
//                .source(entity.getSource())
                .wholeDayUnavailable(entity.getWholeDayUnavailable())
                .build();
    }

    public DailyRateAndAvailability toEntity(DailyRateAndAvailabilityDTO dto) {
        if (dto == null) {
            return null;
        }

        DailyRateAndAvailability entity = new DailyRateAndAvailability();
        DailyRateAndAvailability.DailyRateAndAvailabilityId id = new DailyRateAndAvailability.DailyRateAndAvailabilityId();
        id.setVehicleId(dto.getVehicleId());
        id.setDate(dto.getDate());
        entity.setId(id);

        entity.setCustomSetPrice(dto.getCustom());
        entity.setLocalizedDayOfWeek(dto.getLocalizedDayOfWeek());
//        entity.setLocalizedShortDayOfWeek(dto.getLocalizedShortDayOfWeek());
        entity.setPrice(dto.getPrice());
//        entity.setPriceEditable(dto.getPriceEditable());
        entity.setCurrencyCode(dto.getCurrencyCode());
//        entity.setSource(dto.getSource());
        entity.setWholeDayUnavailable(dto.getWholeDayUnavailable());

        return entity;
    }
}