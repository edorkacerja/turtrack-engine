// src/main/java/com/example/turtrackmanager/service/turtrack/StripeService.java
package com.example.turtrackmanager.service.turtrack;

import com.example.turtrackmanager.config.StripeConfig;
import com.example.turtrackmanager.dto.turtrack.SubscriptionRequest;
import com.example.turtrackmanager.dto.turtrack.SubscriptionResponse;
import com.example.turtrackmanager.model.turtrack.TurtrackSubscription;
import com.example.turtrackmanager.repository.turtrack.SubscriptionRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.Subscription;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.SubscriptionCreateParams;
import com.stripe.param.SubscriptionUpdateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StripeService {
    private final StripeConfig stripeConfig;
    private final SubscriptionRepository subscriptionRepository;

    public Customer createCustomer(String email, String paymentMethodId) throws StripeException {
        CustomerCreateParams params = CustomerCreateParams.builder()
                .setEmail(email)
                .setPaymentMethod(paymentMethodId)
                .setInvoiceSettings(
                        CustomerCreateParams.InvoiceSettings.builder()
                                .setDefaultPaymentMethod(paymentMethodId)
                                .build())
                .build();
        return Customer.create(params);
    }

//    public SubscriptionResponse createSubscription(String customerId, String priceId) throws StripeException {
//        SubscriptionCreateParams params = SubscriptionCreateParams.builder()
//                .setCustomer(customerId)
//                .addItem(
//                        SubscriptionCreateParams.Item.builder()
//                                .setPrice(priceId)
//                                .build()
//                )
//                .addExpand("latest_invoice.payment_intent")
//                .build();
//
//        Subscription stripeSubscription = Subscription.create(params);
//
//        TurtrackSubscription subscription = new TurtrackSubscription();
//        subscription.setCustomerId(customerId);
//        subscription.setSubscriptionId(stripeSubscription.getId());
//        subscription.setPriceId(priceId);
//        subscription.setStatus(stripeSubscription.getStatus());
//
//        subscriptionRepository.save(subscription);
//
//        // Get the client secret from the payment intent
//        String clientSecret = null;
//        if (stripeSubscription.getLatestInvoice() != null &&
//                stripeSubscription.getLatestInvoice().getPaymentIntentObject() != null) {
//            clientSecret = stripeSubscription.getLatestInvoice().getPaymentIntent().getClientSecret();
//        }
//
//        return new SubscriptionResponse(subscription, clientSecret);
//    }

    public SubscriptionResponse getSubscriptionDetails(String subscriptionId) throws StripeException {
        Optional<TurtrackSubscription> subscriptionOpt = subscriptionRepository.findBySubscriptionId(subscriptionId);
        if (subscriptionOpt.isPresent()) {
            TurtrackSubscription subscription = subscriptionOpt.get();

            Subscription stripeSubscription = Subscription.retrieve(subscription.getSubscriptionId());
            subscription.setStatus(stripeSubscription.getStatus());
            subscriptionRepository.save(subscription);

            // No need for client secret when getting details
            return new SubscriptionResponse(subscription, null);
        } else {
            throw new IllegalArgumentException("No subscription found for ID: " + subscriptionId);
        }
    }

//    public SubscriptionResponse updateSubscription(SubscriptionRequest request) throws StripeException {
//        Subscription stripeSubscription = Subscription.retrieve(request.getSubscriptionId());
//
//        SubscriptionUpdateParams params = SubscriptionUpdateParams.builder()
//                .addItem(
//                        SubscriptionUpdateParams.Item.builder()
//                                .setPrice(request.getNewPriceId())
//                                .build()
//                )
//                .build();
//
//        stripeSubscription = stripeSubscription.update(params);
//
//        Optional<TurtrackSubscription> subscriptionOpt = subscriptionRepository.findBySubscriptionId(request.getSubscriptionId());
//        if (subscriptionOpt.isPresent()) {
//            TurtrackSubscription subscription = subscriptionOpt.get();
//            subscription.setPriceId(request.getNewPriceId());
//            subscription.setStatus(stripeSubscription.getStatus());
//            subscriptionRepository.save(subscription);
//
//            // No need for client secret for updates
//            return new SubscriptionResponse(subscription, null);
//        } else {
//            throw new IllegalArgumentException("No subscription found for ID: " + request.getSubscriptionId());
//        }
//    }
}
