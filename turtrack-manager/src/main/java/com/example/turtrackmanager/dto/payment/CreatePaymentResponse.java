package com.example.turtrackmanager.dto.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class CreatePaymentResponse {
    @JsonProperty("client_secret")
    private String clientSecret;

    @JsonProperty("dpm_checker_link")
    private String dpmCheckerLink;

    public CreatePaymentResponse(String clientSecret, String transactionId) {
        this.clientSecret = clientSecret;
        // For demo purposes only
        this.dpmCheckerLink = "https://dashboard.stripe.com/settings/payment_methods/review?transaction_id=" + transactionId;
    }
}