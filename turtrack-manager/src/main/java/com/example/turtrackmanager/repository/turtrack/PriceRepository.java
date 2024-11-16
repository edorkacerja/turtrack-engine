package com.example.turtrackmanager.repository.turtrack;

import com.example.turtrackmanager.model.turtrack.Price;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceRepository extends JpaRepository<Price, String> {
    List<Price> findByActiveTrue();
    List<Price> findByProductIdAndActiveTrue(String productId);
    List<Price> findByInterval(String interval);

    // Useful for finding prices by product and interval (e.g., monthly prices for a product)
    List<Price> findByProductIdAndIntervalAndActiveTrue(String productId, String interval);
}