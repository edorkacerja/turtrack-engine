package com.example.turtrackmanager.dto.turtrack;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PriceDTO {
    private String id;
    private String amount;
    private String interval;
    private String currency;
}