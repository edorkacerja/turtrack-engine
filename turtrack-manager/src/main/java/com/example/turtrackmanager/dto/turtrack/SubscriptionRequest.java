package com.example.turtrackmanager.dto.turtrack;


import lombok.Data;

@Data
public class SubscriptionRequest {
    private String email;
    private String paymentMethodId;
    private String priceId;
    private String subscriptionId; // Added for updates
    private String newPriceId; // Added for updates
}