package com.example.turtrackmanager.repository.turtrack;

import com.example.turtrackmanager.model.turtrack.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByActiveTrue();
    boolean existsByName(String name);
}