package com.example.turtrackmanager.service.stripe;

import com.example.turtrackmanager.config.StripeConfig;
import com.example.turtrackmanager.dto.turtrack.PriceDTO;
import com.example.turtrackmanager.dto.turtrack.ProductDTO;
import com.example.turtrackmanager.model.turtrack.User;
import com.example.turtrackmanager.repository.turtrack.UserRepository;
import com.example.turtrackmanager.service.turtrack.UserService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.*;
import com.stripe.model.billingportal.Configuration;
import com.stripe.model.billingportal.Session;
import com.stripe.param.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.param.billingportal.ConfigurationCreateParams;
import com.stripe.param.billingportal.SessionCreateParams;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class StripeService {

    private final ObjectMapper objectMapper;
    private final StripeConfig stripeConfig;
    private final UserService userService;
    private final UserRepository userRepository;

    public String createPortalSession(String email, String returnUrl) throws StripeException {
        Stripe.apiKey = stripeConfig.getSecretKey();

        // First, try to find or create a customer
        Customer stripeCustomer = findOrCreateCustomer(email);

        SessionCreateParams sessionCreateParams = null;

        SubscriptionListParams params =
                SubscriptionListParams.builder().setLimit(1L)
                        .setCustomer(stripeCustomer.getId()).build();

        SubscriptionCollection customerSubscriptions = Subscription.list(params);


        List<Price> prices = getPrices();
        List<Product> products = getProducts();





            ConfigurationCreateParams configurationCreateParams =
                    ConfigurationCreateParams.builder()
                            .setFeatures(
                                    ConfigurationCreateParams.Features.builder()
                                            .setInvoiceHistory(
                                                    ConfigurationCreateParams.Features.InvoiceHistory.builder()
                                                            .setEnabled(true)
                                                            .build()
                                            )
                                            .setCustomerUpdate(ConfigurationCreateParams.Features.CustomerUpdate.builder()
                                                    .setEnabled(true)
                                                    .addAllAllowedUpdate(List.of(ConfigurationCreateParams.Features.CustomerUpdate.AllowedUpdate.NAME,
                                                            ConfigurationCreateParams.Features.CustomerUpdate.AllowedUpdate.ADDRESS))
                                                    .build())
                                            .setSubscriptionCancel(ConfigurationCreateParams.Features.SubscriptionCancel.builder()
                                                    .setEnabled(true)
                                                    .build())
                                            .setSubscriptionUpdate(ConfigurationCreateParams.Features.SubscriptionUpdate.builder()
                                                    .setEnabled(true)
                                                            .setDefaultAllowedUpdates(List.of(ConfigurationCreateParams.Features.SubscriptionUpdate.DefaultAllowedUpdate.PRICE,
                                                                    ConfigurationCreateParams.Features.SubscriptionUpdate.DefaultAllowedUpdate.PROMOTION_CODE))
                                                    .setProducts(List.of(ConfigurationCreateParams.Features.SubscriptionUpdate.Product.builder()
                                                                    .setProduct(products.get(0).getId())
                                                                    .addAllPrice(prices.stream().map(Price::getId).toList())
                                                            .build()))
                                                    .build())
                                            .setPaymentMethodUpdate(ConfigurationCreateParams.Features.PaymentMethodUpdate.builder()
                                                    .setEnabled(true)
                                                    .build())
                                            .build()

                            )
                            .build();

            Configuration configuration = Configuration.create(configurationCreateParams);

            sessionCreateParams =
                    SessionCreateParams.builder()
                            .setCustomer(stripeCustomer.getId())
                            .setReturnUrl("https://example.com/account/overview")
                            .setConfiguration(configuration.getId())
//                            .setFlowData(
//                                    SessionCreateParams.FlowData.builder()
//                                            .setType(SessionCreateParams.FlowData.Type.SUBSCRIPTION_UPDATE_CONFIRM)
//                                            .setSubscriptionUpdateConfirm(
//                                                    SessionCreateParams.FlowData.SubscriptionUpdateConfirm.builder()
//                                                            .setSubscription(customerSubscriptions.getData().get(0).getId())
//                                                            .addItem(
//                                                                    SessionCreateParams.FlowData.SubscriptionUpdateConfirm.Item.builder()
//                                                                            .setId(customerSubscriptions.getData().get(0).getItems().getData().get(0).getId())
//                                                                            .setQuantity(1L)
//                                                                            .setPrice(prices.get(2).getId())
//                                                                            .build()
//                                                            )
////                                                            .addDiscount(
////                                                                    SessionCreateParams.FlowData.SubscriptionUpdateConfirm.Discount.builder()
////                                                                            .setCoupon("{{COUPON_ID}}")
////                                                                            .build()
////                                                            )
//                                                            .build()
//                                            )
//                                            .build()
//                            )
//
                            .build();






//            params =
//                    SessionCreateParams.builder()
//                            .setCustomer(stripeCustomer.getId())
//                        .addLineItem(SessionCreateParams.LineItem.builder()
//                                .setPrice(selectedPriceId)
//                                .setQuantity(1L)
//                                .build())
////                            .setReturnUrl(returnUrl)
//                        .setSuccessUrl(returnUrl)
//                        .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
//                            .build();



        Session session =
                Session.create(sessionCreateParams);

        return session.getUrl();
    }

    private List<Price> getPrices() throws StripeException {
        PriceListParams params = PriceListParams.builder()
                .setActive(true)
                .setType(PriceListParams.Type.RECURRING)
                .setLimit(3L)  // Adjust based on your number of plans
                .build();

        return Price.list(params).getData();
    }

    private List<Product> getProducts() throws StripeException {
        ProductListParams params = ProductListParams.builder()
                .setActive(true)
                .setType(ProductListParams.Type.SERVICE)
                .setLimit(3L)  // Adjust based on your number of plans
                .build();

        return Product.list(params).getData();
    }

    private Customer findOrCreateCustomer(String email) throws StripeException {
        Stripe.apiKey = stripeConfig.getSecretKey();

        // First, search for existing customer
        CustomerSearchParams params = CustomerSearchParams.builder()
                .setQuery("email:'" + email + "'")
                .build();

        CustomerSearchResult customers = Customer.search(params);

        if (!customers.getData().isEmpty()) {
            // Found existing customer
            Customer customer = customers.getData().get(0);

            // Optional: Update DB if for some reason the ID isn't saved
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new EntityNotFoundException(email));
            if (user.getStripeCustomerId() == null) {
                user.setStripeCustomerId(customer.getId());
                userRepository.save(user);
            }

            return customer;
        }

        // If no customer exists, create a new one
        CustomerCreateParams customerParams = CustomerCreateParams.builder()
                .setEmail(email)
                .build();

        Customer newCustomer = Customer.create(customerParams);

        // Save the new Stripe customer ID to database
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException(email));
        user.setStripeCustomerId(newCustomer.getId());
        userRepository.save(user);

        return newCustomer;
    }

    public Price getCurrentPrice(String email) {
        try {
            Stripe.apiKey = stripeConfig.getSecretKey();

            User user = userService.findUserByEmail(email);
            if (user.getStripeCustomerId() == null) {
                return null;
            }

            // Get active subscription
            SubscriptionListParams params = SubscriptionListParams.builder()
                    .setCustomer(user.getStripeCustomerId())
                    .setStatus(SubscriptionListParams.Status.ACTIVE)
                    .setLimit(1L)
                    .build();

            SubscriptionCollection subscriptions = Subscription.list(params);

            if (subscriptions.getData().isEmpty()) {
                return null;
            }

            // Get the price from the subscription
            return subscriptions.getData().get(0)
                    .getItems().getData().get(0)
                    .getPrice();
        } catch (StripeException e) {
            throw new RuntimeException("Error fetching price from Stripe", e);
        }
    }


    public List<ProductDTO> getProducts(String currentSubscriptionPriceId) throws StripeException {
        // Fetch all active prices
        PriceListParams params = PriceListParams.builder()
                .setActive(true)
                .build();

        PriceCollection prices = Price.list(params);

        // Group prices by product
        Map<String, List<Price>> pricesByProduct = prices.getData().stream()
                .collect(Collectors.groupingBy(Price::getProduct));

        List<ProductDTO> productDTOs = new ArrayList<>();

        // Process each product and its prices
        for (Map.Entry<String, List<Price>> entry : pricesByProduct.entrySet()) {
            String productId = entry.getKey();
            List<Price> productPrices = entry.getValue();

            if (productPrices.isEmpty()) continue;

            try {
                // Fetch the product details
                Product product = Product.retrieve(productId);
                if (!product.getActive()) continue;

                // Get default price (assuming the first active price is default)
                Price defaultPrice = productPrices.get(0);

                List<PriceDTO> priceDTOs = productPrices.stream()
                        .map(this::mapToBasicPriceDTO)
                        .collect(Collectors.toList());

                ProductDTO productDTO = ProductDTO.builder()
                        .id(product.getId())
                        .name(product.getName())
                        .description(product.getDescription())
                        .priceId(defaultPrice.getId())
                        .price(formatAmount(defaultPrice.getUnitAmount()))
                        .interval(defaultPrice.getRecurring().getInterval())
                        .features(parseFeatures(product))
                        .availablePrices(priceDTOs)
                        .isCurrentPlan(priceDTOs.stream()
                                .anyMatch(price -> price.getId().equals(currentSubscriptionPriceId)))
                        .build();

                productDTOs.add(productDTO);
            } catch (StripeException e) {
                log.error("Error fetching product {}: {}", productId, e.getMessage());
            }
        }

        return productDTOs;
    }

    private PriceDTO mapToBasicPriceDTO(Price price) {
        return PriceDTO.builder()
                .id(price.getId())
                .amount(formatAmount(price.getUnitAmount()))
                .interval(price.getRecurring().getInterval())
                .currency(price.getCurrency().toUpperCase())
                .build();
    }

    private List<String> parseFeatures(Product product) {
        try {
            String featuresJson = product.getMetadata().get("features");
            if (featuresJson != null) {
                return objectMapper.readValue(featuresJson, new TypeReference<List<String>>() {});
            }
        } catch (Exception e) {
            log.error("Error parsing features for product {}: {}", product.getId(), e.getMessage());
        }
        return new ArrayList<>();
    }

    private String formatAmount(Long amount) {
        if (amount == null) return "0.00";
        return String.format("%.2f", amount / 100.0);
    }
}