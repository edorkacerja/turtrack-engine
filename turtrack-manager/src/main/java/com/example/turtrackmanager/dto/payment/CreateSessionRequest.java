package com.example.turtrackmanager.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSessionRequest {
    private String customerId;
    private String email;
    private String firstName;
    private String lastName;
    private String priceId;
    private String currency;
}