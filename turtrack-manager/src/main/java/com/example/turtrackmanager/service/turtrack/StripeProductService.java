//package com.example.turtrackmanager.service.turtrack;
//
//import com.example.turtrackmanager.dto.turtrack.PlanDTO;
//import com.example.turtrackmanager.model.turtrack.Price;
//import com.example.turtrackmanager.model.turtrack.Product;
//import com.example.turtrackmanager.repository.turtrack.PriceRepository;
//import com.example.turtrackmanager.repository.turtrack.ProductRepository;
//import com.stripe.exception.StripeException;
//import com.stripe.model.PriceCollection;
//import com.stripe.model.ProductCollection;
//import com.stripe.param.PriceListParams;
//import com.stripe.param.ProductListParams;
//import jakarta.transaction.Transactional;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.stereotype.Service;
//
//import java.math.BigDecimal;
//import java.util.*;
//import java.util.stream.Collectors;
//
//@Service
//@RequiredArgsConstructor
//@Slf4j
//public class StripeProductService {
//    private final ProductRepository productRepository;
//    private final PriceRepository priceRepository;
//
//    @Transactional
//    public void syncProductsFromStripe() {
//        try {
//            log.info("Starting Stripe products sync");
//
//            // Fetch all active products from Stripe
//            ProductListParams productParams = ProductListParams.builder()
//                    .setActive(true)
//                    .setLimit(100L)
//                    .build();
//
//            ProductCollection stripeProducts = com.stripe.model.Product.list(productParams);
//            Set<String> updatedProductIds = new HashSet<>();
//
//            for (com.stripe.model.Product stripeProduct : stripeProducts.getData()) {
//                try {
//                    syncProduct(stripeProduct);
//                    updatedProductIds.add(stripeProduct.getId());
//                } catch (Exception e) {
//                    log.error("Error syncing product {}: {}", stripeProduct.getId(), e.getMessage());
//                }
//            }
//
//            // Deactivate products that are no longer active in Stripe
//            productRepository.findByActiveTrue().stream()
//                    .filter(product -> !updatedProductIds.contains(product.getId()))
//                    .forEach(product -> {
//                        product.setActive(false);
//                        productRepository.save(product);
//                        log.info("Deactivated product: {}", product.getId());
//                    });
//
//            log.info("Completed Stripe products sync");
//        } catch (StripeException e) {
//            log.error("Failed to sync products from Stripe", e);
//            throw new RuntimeException("Failed to sync products from Stripe", e);
//        }
//    }
//
//    @Transactional
//    protected void syncProduct(com.stripe.model.Product stripeProduct) throws StripeException {
//        // Create or update product
//        Product product = productRepository.findById(stripeProduct.getId())
//                .orElse(new Product());
//
//        product.setId(stripeProduct.getId());
//        product.setName(stripeProduct.getName());
//        product.setDescription(stripeProduct.getDescription());
//        product.setActive(stripeProduct.getActive());
//
//        // Save product first to establish the relationship
//        product = productRepository.save(product);
//
//        // Sync prices for this product
//        syncPricesForProduct(product, stripeProduct.getId());
//    }
//
//    @Transactional
//    protected void syncPricesForProduct(Product product, String stripeProductId) throws StripeException {
//        PriceListParams priceParams = PriceListParams.builder()
//                .setProduct(stripeProductId)
//                .setActive(true)
//                .build();
//
//        PriceCollection stripePrices = com.stripe.model.Price.list(priceParams);
//        Set<String> updatedPriceIds = new HashSet<>();
//
//        for (com.stripe.model.Price stripePrice : stripePrices.getData()) {
//            try {
//                Price price = priceRepository.findById(stripePrice.getId())
//                        .orElse(new Price());
//
//                price.setId(stripePrice.getId());
//                price.setProduct(product);
//                price.setAmount(new BigDecimal(stripePrice.getUnitAmount())
//                        .divide(new BigDecimal(100))); // Convert from cents
//                price.setCurrency(stripePrice.getCurrency().toUpperCase());
//                price.setInterval(stripePrice.getRecurring().getInterval());
//                price.setActive(true);
//
//                priceRepository.save(price);
//                updatedPriceIds.add(price.getId());
//                log.debug("Synced price: {}", price.getId());
//            } catch (Exception e) {
//                log.error("Error syncing price {}: {}", stripePrice.getId(), e.getMessage());
//            }
//        }
//
//        // Deactivate prices that are no longer active in Stripe
//        priceRepository.findByProductIdAndActiveTrue(product.getId()).stream()
//                .filter(price -> !updatedPriceIds.contains(price.getId()))
//                .forEach(price -> {
//                    price.setActive(false);
//                    priceRepository.save(price);
//                    log.info("Deactivated price: {}", price.getId());
//                });
//    }
//
//    public List<PlanDTO> getAvailablePlans() {
//        return priceRepository.findByActiveTrue().stream()
//                .map(this::convertToPlanDTO)
//                .sorted(Comparator.comparing(PlanDTO::getAmount))
//                .collect(Collectors.toList());
//    }
//
//    public List<PlanDTO> getAvailablePlansByInterval(String interval) {
//        return priceRepository.findByProductIdAndIntervalAndActiveTrue(interval)
//                .stream()
//                .map(this::convertToPlanDTO)
//                .sorted(Comparator.comparing(PlanDTO::getAmount))
//                .collect(Collectors.toList());
//    }
//
//    private PlanDTO convertToPlanDTO(Price price) {
//        return new PlanDTO(
//                price.getId(),
//                price.getProduct().getName(),
//                price.getProduct().getDescription(),
//                price.getAmount(),
//                price.getInterval(),
//                getFeaturesForProduct(price.getProduct())
//        );
//    }
//
//    private List<String> getFeaturesForProduct(Product product) {
//        // In the future, you might want to fetch these from Stripe metadata
//        // For now, return a default list based on the product name/type
//        return switch (product.getName().toLowerCase()) {
//            case "turtrack starter" -> Arrays.asList(
//                    "Basic tracking functionality",
//                    "Up to 5 users",
//                    "Weekly reports",
//                    "Email support"
//            );
//            case "turtrack pro" -> Arrays.asList(
//                    "Everything in Starter",
//                    "Up to 20 users",
//                    "Advanced tracking features",
//                    "Priority support",
//                    "API access"
//            );
//            case "turtrack enterprise" -> Arrays.asList(
//                    "Everything in Pro",
//                    "Unlimited users",
//                    "Custom integrations",
//                    "24/7 dedicated support",
//                    "SLA guarantee"
//            );
//            default -> Collections.emptyList();
//        };
//    }
//}