// src/main/java/com/example/turtrackmanager/service/turtrack/StripeWebhookService.java
package com.example.turtrackmanager.service.turtrack;

import com.example.turtrackmanager.model.turtrack.TurtrackSubscription;
import com.example.turtrackmanager.repository.turtrack.SubscriptionRepository;
import com.stripe.model.Event;
import com.stripe.model.Invoice;
import com.stripe.model.Subscription;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StripeWebhookService {
    private final SubscriptionRepository subscriptionRepository;

    public void handleEvent(Event event) {
        switch (event.getType()) {
            case "customer.subscription.updated":
            case "customer.subscription.created":
                Subscription stripeSubscription = (Subscription) event.getData().getObject();
                updateSubscription(stripeSubscription);
                break;
            // Handle other event types as needed
            default:
                // Unexpected event type
        }
    }

    private void updateSubscription(Subscription stripeSubscription) {
        String subscriptionId = stripeSubscription.getId();
        TurtrackSubscription turtrackSubscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElse(null);
        if (turtrackSubscription != null) {
            turtrackSubscription.setStatus(stripeSubscription.getStatus());
            subscriptionRepository.save(turtrackSubscription);
        }
    }

//    private void handleInvoiceEvent(Invoice invoice) {
//        String subscriptionId = invoice.getSubscription();
//        if (subscriptionId == null) {
//            // Invoice not associated with a subscription
//            return;
//        }
//
//        TurtrackSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
//                .orElse(null);
//        if (subscription != null) {
//            if ("paid".equals(invoice.getPaymentStatus())) {
//                subscription.setStatus("active");
//            } else if ("unpaid".equals(invoice.getPaymentStatus())) {
//                subscription.setStatus("past_due");
//            }
//            // Add more status updates as needed
//            subscriptionRepository.save(subscription);
//        }
//    }
}
