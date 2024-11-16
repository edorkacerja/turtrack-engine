package com.example.turtrackmanager.repository.turtrack;

import com.example.turtrackmanager.model.turtrack.TurtrackSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<TurtrackSubscription, Long> {
    Optional<TurtrackSubscription> findBySubscriptionId(String subscriptionId);
    Optional<TurtrackSubscription> findByCustomerId(String customerId);
}
