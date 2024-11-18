package com.example.turtrackmanager.service.stripe;

import com.example.turtrackmanager.dto.turtrack.PriceDTO;
import com.example.turtrackmanager.dto.turtrack.ProductDTO;
import com.stripe.exception.StripeException;
import com.stripe.model.Price;
import com.stripe.model.PriceCollection;
import com.stripe.model.Product;
import com.stripe.param.PriceListParams;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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