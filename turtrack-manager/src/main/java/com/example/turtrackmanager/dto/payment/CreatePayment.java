package com.example.turtrackmanager.dto.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class CreatePayment {
    private CreatePaymentItem[] items;

    @Data
    public static class CreatePaymentItem {
        private String id;
        private Long amount;
    }
}