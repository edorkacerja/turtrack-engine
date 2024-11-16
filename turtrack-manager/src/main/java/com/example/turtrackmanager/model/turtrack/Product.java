package com.example.turtrackmanager.model.turtrack;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
public class Product {
    @Id
    private String id;  // Stripe product ID
    private String name;
    private String description;
    private boolean active;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<Price> prices = new ArrayList<>();
}