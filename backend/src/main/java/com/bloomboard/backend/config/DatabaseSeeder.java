package com.bloomboard.backend.config;

import com.bloomboard.backend.domain.Batch;
import com.bloomboard.backend.repository.BatchRepository;
import com.bloomboard.backend.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final InventoryService inventoryService;
    private final BatchRepository batchRepository;

    @Override
    public void run(String... args) {
        try {
            String result = inventoryService.seedDatabaseIfEmpty();
            log.info("DatabaseSeeder result: {}", result);

            // Ensure 4 popular flower varieties (Carnation, Freesia, Gerbera, Alstroemeria) have near-expiry batches (expiring in 30 hours)
            // to display the 50% OFF (NEAR EXPIRY) discount tag in the store
            List<Batch> activeBatches = batchRepository.findAll();
            int discountedCount = 0;
            for (Batch b : activeBatches) {
                if (b.getProduct() != null) {
                    String name = b.getProduct().getName();
                    if ("Carnation".equalsIgnoreCase(name) || "Freesia".equalsIgnoreCase(name) ||
                        "Gerbera".equalsIgnoreCase(name) || "Alstroemeria".equalsIgnoreCase(name)) {
                        b.setExpiryDate(LocalDateTime.now().plusHours(30));
                        batchRepository.save(b);
                        discountedCount++;
                    }
                }
            }
            log.info("Updated {} batches with near-expiry dates (30 hours to expiry) for 50% OFF discounts.", discountedCount);
        } catch (Exception e) {
            log.error("DatabaseSeeder failed, but allowing application to start.", e);
        }
    }
}
