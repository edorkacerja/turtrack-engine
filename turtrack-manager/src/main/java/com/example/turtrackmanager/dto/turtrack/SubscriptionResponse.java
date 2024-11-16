package com.example.turtrackmanager.dto.turtrack;

import com.example.turtrackmanager.model.turtrack.TurtrackSubscription;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SubscriptionResponse {
    private TurtrackSubscription turtrackSubscription;
    private String clientSecret;
}
