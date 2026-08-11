package com.bloomboard.backend.service;

import com.bloomboard.backend.domain.Batch;
import com.bloomboard.backend.repository.BatchRepository;
import com.bloomboard.backend.service.dto.BatchAllocationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final BatchRepository batchRepository;

    /**
     * Allocates stock for a given product based on FEFO (First-Expiring, First-Out).
     * This method calculates the allocation but does NOT automatically save to DB.
     * The calling OrderService will persist the updated batches and create OrderAllocations.
     *
     * @param productId The ID of the product to allocate
     * @param quantityRequired The total quantity needed
     * @return BatchAllocationResult containing the allocation map or an error if insufficient stock
     */
    @Transactional(readOnly = true)
    public BatchAllocationResult allocateFefo(UUID productId, int quantityRequired) {
        log.info("Attempting FEFO allocation for product {} - quantity needed: {}", productId, quantityRequired);
        
        if (quantityRequired <= 0) {
            return new BatchAllocationResult(false, null, "Quantity required must be greater than 0");
        }

        List<Batch> activeBatches = batchRepository.findActiveBatchesForProductOrderByExpiry(productId, LocalDateTime.now());
        
        int totalAvailable = activeBatches.stream().mapToInt(Batch::getQuantityAvailable).sum();
        if (totalAvailable < quantityRequired) {
            log.warn("Insufficient stock for product {}. Needed: {}, Available: {}", productId, quantityRequired, totalAvailable);
            return new BatchAllocationResult(false, null, "Insufficient stock. Only " + totalAvailable + " available.");
        }

        Map<Batch, Integer> allocationMap = new HashMap<>();
        int remainingToAllocate = quantityRequired;

        for (Batch batch : activeBatches) {
            if (remainingToAllocate <= 0) {
                break;
            }

            int availableInBatch = batch.getQuantityAvailable();
            int amountToTake = Math.min(availableInBatch, remainingToAllocate);

            allocationMap.put(batch, amountToTake);
            remainingToAllocate -= amountToTake;
        }

        if (remainingToAllocate > 0) {
            // This should theoretically not be hit due to the totalAvailable check, 
            // but is a safe guard against race conditions if readOnly isn't strictly locking.
            return new BatchAllocationResult(false, null, "Failed to allocate complete quantity due to concurrent stock changes.");
        }

        log.info("Successfully allocated {} units across {} batches for product {}", quantityRequired, allocationMap.size(), productId);
        return new BatchAllocationResult(true, allocationMap, null);
    }

    /**
     * Scheduled job to automatically mark expired active batches as EXPIRED.
     * Runs every hour.
     */
    @Transactional
    // @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 * * * *") // Uncomment when scheduling is enabled
    public void markExpiredBatches() {
        log.info("Running scheduled job: markExpiredBatches");
        List<Batch> expiredBatches = batchRepository.findByStatusAndExpiryDateBefore(
                Batch.BatchStatus.ACTIVE, LocalDateTime.now());
        
        for (Batch batch : expiredBatches) {
            log.info("Marking batch {} as EXPIRED", batch.getId());
            batch.setStatus(Batch.BatchStatus.EXPIRED);
        }
        batchRepository.saveAll(expiredBatches);
        log.info("Finished markExpiredBatches. Updated {} batches.", expiredBatches.size());
    }
}
