package com.bloomboard.backend.service;

import com.bloomboard.backend.domain.Batch;
import com.bloomboard.backend.repository.BatchRepository;
import com.bloomboard.backend.service.dto.BatchAllocationResult;
import com.bloomboard.backend.controller.dto.ReceiveBatchRequest;
import com.bloomboard.backend.domain.Product;
import com.bloomboard.backend.repository.ProductRepository;
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
    private final ProductRepository productRepository;

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
            return new BatchAllocationResult(false, null, "Failed to allocate complete quantity due to concurrent stock changes.");
        }

        log.info("Successfully allocated {} units across {} batches for product {}", quantityRequired, allocationMap.size(), productId);
        return new BatchAllocationResult(true, allocationMap, null);
    }

    @Transactional
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

    @Transactional(readOnly = true)
    public List<Batch> getAllActiveBatches() {
        return batchRepository.findAllActiveBatchesWithProductOrderByExpiryDateAsc();
    }

    @Transactional
    public Batch receiveNewBatch(ReceiveBatchRequest request) {
        log.info("Receiving new batch for product id: {}", request.getProductId());
        
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + request.getProductId()));

        Batch batch = new Batch();
        batch.setProduct(product);
        batch.setSupplierName(request.getSupplierName());
        batch.setQuantityInitial(request.getQuantity());
        batch.setQuantityAvailable(request.getQuantity());
        batch.setPurchasePrice(request.getPurchasePrice());
        batch.setReceivedDate(LocalDateTime.now());
        batch.setExpiryDate(request.getExpiryDate());
        batch.setStatus(Batch.BatchStatus.ACTIVE);

        return batchRepository.save(batch);
    }

    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Transactional
    public void wasteBatch(UUID batchId) {
        log.info("Marking batch {} as WASTED", batchId);
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Batch not found with id: " + batchId));
        
        batch.setStatus(Batch.BatchStatus.DISCARDED);
        batch.setQuantityAvailable(0);
        batchRepository.save(batch);
    }
}
