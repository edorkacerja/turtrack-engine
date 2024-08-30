package com.example.turtrackmanager.dto;

import com.example.turtrackmanager.model.turtrack.Vehicle;
import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;

@Data
@Builder
public class VehicleDTO {
    private Long id;
    private String make;
    private String model;
    private Integer year;
    private String trim;
    private String type;
    private String registrationState;
    private String city;
    private String state;
    private Double averageDailyPrice;
    private String country;
    private String cellId;
    private LocalDateTime pricingLastUpdated;
    private LocalDateTime searchLastUpdated;
    private LocalDateTime detailLastUpdated;
    private String status;

    public static VehicleDTO toDto(Vehicle vehicle) {
        return VehicleDTO.builder()
                .id(vehicle.getId())
                .make(vehicle.getMake())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .trim(vehicle.getTrim())
                .type(vehicle.getType())
                .registrationState(vehicle.getRegistrationState())
                .city(vehicle.getCity())
                .state(vehicle.getState())
                .averageDailyPrice(vehicle.getAverageDailyPrice())
                .country(vehicle.getCountry())
                .cellId(vehicle.getCellId())
                .pricingLastUpdated(vehicle.getPricingLastUpdated())
                .searchLastUpdated(vehicle.getSearchLastUpdated())
                .detailLastUpdated(vehicle.getDetailLastUpdated())
                .status(vehicle.getStatus())
                .build();
    }

    public Vehicle toEntity() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(this.id);
        vehicle.setMake(this.make);
        vehicle.setModel(this.model);
        vehicle.setYear(this.year);
        vehicle.setTrim(this.trim);
        vehicle.setType(this.type);
        vehicle.setRegistrationState(this.registrationState);
        vehicle.setCity(this.city);
        vehicle.setState(this.state);
        vehicle.setAverageDailyPrice(this.averageDailyPrice);
        vehicle.setCountry(this.country);
        vehicle.setCellId(this.cellId);
        vehicle.setPricingLastUpdated(this.pricingLastUpdated);
        vehicle.setSearchLastUpdated(this.searchLastUpdated);
        vehicle.setDetailLastUpdated(this.detailLastUpdated);
        vehicle.setStatus(this.status);
        return vehicle;
    }
}