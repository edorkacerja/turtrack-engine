package com.example.turtrackmanager.dto.turtrack;

import com.stripe.model.Price;
import com.stripe.model.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductWithPricesDTO {
    private Product product;
    private List<Price> prices;
}