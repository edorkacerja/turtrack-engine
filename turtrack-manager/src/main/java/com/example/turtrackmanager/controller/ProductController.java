package com.example.turtrackmanager.controller;

import com.example.turtrackmanager.dto.turtrack.PriceDTO;
import com.example.turtrackmanager.dto.turtrack.ProductDTO;
import com.example.turtrackmanager.dto.turtrack.ProductWithPricesDTO;
import com.example.turtrackmanager.service.turtrack.ProductService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.exception.StripeException;
import com.stripe.model.Price;
import com.stripe.model.Product;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

import static org.hibernate.query.sqm.tree.SqmNode.log;

@RestController
@RequestMapping("/api/v1/products")
@AllArgsConstructor
@Slf4j
public class ProductController {

    private final ProductService productService;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAllProducts() {
        try {
            List<ProductWithPricesDTO> productsWithPrices = productService.getAllProducts();
            List<ProductDTO> productDTOs = productsWithPrices.stream()
                    .map(this::convertToDTO)
                    .toList();
            return ResponseEntity.ok(productDTOs);
        } catch (StripeException e) {
            log.error("Error fetching products: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private ProductDTO convertToDTO(ProductWithPricesDTO productWithPrices) {
        Product product = productWithPrices.getProduct();
        List<Price> prices = productWithPrices.getPrices();

        // Get default price
        String priceId = null;
        String priceAmount = "0";
        String interval = "month";

        // Try to get price from prices list first
        if (!prices.isEmpty()) {
            Price defaultPrice = prices.get(0); // Using first price as default
            priceId = defaultPrice.getId();
            if (defaultPrice.getUnitAmount() != null) {
                priceAmount = String.format("%.2f", defaultPrice.getUnitAmount().doubleValue() / 100);
            }
            if (defaultPrice.getRecurring() != null) {
                interval = defaultPrice.getRecurring().getInterval();
            }
        }

        // Parse features from metadata
        List<String> features = new ArrayList<>();
        if (product.getMetadata() != null && product.getMetadata().get("features") != null) {
            try {
                features = objectMapper.readValue(
                        product.getMetadata().get("features"),
                        new TypeReference<List<String>>() {}
                );
            } catch (JsonProcessingException e) {
                log.error("Error parsing features for product {}: ", product.getId(), e);
            }
        }

        // If no features were found in metadata, try to create a default list
        if (features.isEmpty() && product.getDescription() != null) {
            features.add(product.getDescription());
        }

        // Create list of available prices
        List<PriceDTO> priceList = prices.stream()
                .map(price -> PriceDTO.builder()
                        .id(price.getId())
                        .amount(String.format("%.2f", price.getUnitAmount().doubleValue() / 100))
                        .interval(price.getRecurring() != null ? price.getRecurring().getInterval() : "one-time")
                        .currency(price.getCurrency().toUpperCase())
                        .build())
                .toList();

        return ProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(priceAmount)
                .priceId(priceId)
                .features(features)
                .interval(interval)
                .availablePrices(priceList) // Add all available prices
                .build();
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ProductDTO> getProduct(@PathVariable String productId) {
        try {
            ProductWithPricesDTO productWithPrices = productService.getProduct(productId);
            return ResponseEntity.ok(convertToDTO(productWithPrices));
        } catch (StripeException e) {
            log.error("Error fetching product {}: ", productId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}