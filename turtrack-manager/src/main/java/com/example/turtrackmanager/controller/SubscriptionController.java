// src/main/java/com/example/turtrackmanager/controller/SubscriptionController.java

package com.example.turtrackmanager.controller;

import com.example.turtrackmanager.dto.turtrack.CreateSubscriptionResponse;
import com.example.turtrackmanager.dto.turtrack.PlanDTO;
import com.example.turtrackmanager.dto.turtrack.SubscriptionRequest;
import com.example.turtrackmanager.dto.turtrack.SubscriptionResponse;
import com.example.turtrackmanager.model.turtrack.TurtrackSubscription;
import com.example.turtrackmanager.service.turtrack.StripeService;
import com.stripe.exception.StripeException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {
    private final StripeService stripeService;


//    @GetMapping("/plans")
//    public ResponseEntity<List<PlanDTO>> getPlans() {
//        return ResponseEntity.ok(stripeProductService.getAvailablePlans());
//    }

//    @PostMapping("/create")
//    public ResponseEntity<SubscriptionResponse> createSubscription(
//            @RequestBody SubscriptionRequest request,
//            @AuthenticationPrincipal OAuth2User principal) {
//
//        String email = principal.getAttribute("email");
//        TurtrackSubscription subscription = stripeService.createSubscription(
//                email,
//                request.getPriceId()
//        );
//
//        return ResponseEntity.ok(new SubscriptionResponse(subscription, null));
//    }

//    @PostMapping("/create")
//    public ResponseEntity<?> createSubscription(@RequestBody SubscriptionRequest request) {
//        try {
//            // Create Stripe customer
//            com.stripe.model.Customer customer = stripeService.createCustomer(
//                    request.getEmail(),
//                    request.getPaymentMethodId()
//            );
//
//            // Create subscription in your system and get clientSecret
//            CreateSubscriptionResponse response = stripeService.createSubscription(
//                    customer.getId(),
//                    request.getPriceId()
//            );
//
//            if (response.getClientSecret() != null) {
//                // Return both subscription details and client secret
//                return ResponseEntity.ok(new SubscriptionResponse(response.getTurtrackSubscription(), response.getClientSecret()));
//            }
//
//            // If no payment confirmation is needed, return the subscription details
//            return ResponseEntity.ok(response.getTurtrackSubscription());
//        } catch (StripeException e) {
//            // Handle Stripe exceptions
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                    .body(Collections.singletonMap("error", e.getMessage()));
//        } catch (Exception e) {
//            // Handle other exceptions
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(Collections.singletonMap("error", "An unexpected error occurred."));
//        }
//    }

    @GetMapping
    public ResponseEntity<?> getSubscriptionDetails(@RequestParam String userId) {
        // Fetch subscription details by userId
        // Assume `stripeService.getSubscriptionDetails()` retrieves details
        try {
            SubscriptionResponse response = stripeService.getSubscriptionDetails(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Unable to fetch subscription details."));
        }
    }

//    @PostMapping("/update")
//    public ResponseEntity<?> updateSubscription(@RequestBody SubscriptionRequest request) {
//        try {
//            // Update subscription in Stripe or your database
//            SubscriptionResponse response = stripeService.updateSubscription(
//                    request.getSubscriptionId(),
//                    request.getPlan()
//            );
//            return ResponseEntity.ok(response);
//        } catch (StripeException e) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                    .body(Collections.singletonMap("error", e.getMessage()));
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(Collections.singletonMap("error", "An unexpected error occurred."));
//        }
//    }


}
