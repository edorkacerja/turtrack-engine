package com.example.turtrackmanager.dto.turtrack;


import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class ProductDTO {
    private String id;
    private String name;
    private String description;
    private String price;
    private List<String> features;
    private String priceId;
    private String interval;
    private List<PriceDTO> availablePrices; // Added this field
}