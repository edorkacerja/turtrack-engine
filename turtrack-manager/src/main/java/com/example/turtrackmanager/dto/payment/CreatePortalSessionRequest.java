package com.example.turtrackmanager.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreatePortalSessionRequest {
    private String email;
    private String returnUrl;
//    private String selectedPriceId;
//    private String currentPriceId;
}