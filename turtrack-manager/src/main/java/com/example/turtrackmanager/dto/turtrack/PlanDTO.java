package com.example.turtrackmanager.dto.turtrack;


import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class PlanDTO {
    private String priceId;
    private String name;
    private String description;
    private double price;
    private List<String> features;
}