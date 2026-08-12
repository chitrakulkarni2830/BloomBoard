package com.bloomboard.backend.controller;

import com.bloomboard.backend.controller.dto.BatchResponse;
import com.bloomboard.backend.controller.dto.ReceiveBatchRequest;
import com.bloomboard.backend.domain.Batch;
import com.bloomboard.backend.domain.Product;
import com.bloomboard.backend.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allows React frontend to connect
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/batches")
    public List<BatchResponse> getAllBatches() {
        return inventoryService.getAllActiveBatches().stream()
                .map(this::mapToBatchResponse)
                .toList();
    }

    @PostMapping("/batches/{id}/waste")
    public ResponseEntity<Void> wasteBatch(@PathVariable UUID id) {
        inventoryService.wasteBatch(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/batches")
    @ResponseStatus(HttpStatus.CREATED)
    public BatchResponse receiveNewBatch(@Valid @RequestBody ReceiveBatchRequest request) {
        Batch newBatch = inventoryService.receiveNewBatch(request);
        return mapToBatchResponse(newBatch);
    }

    @GetMapping("/products")
    public List<Product> getAllProducts() {
        return inventoryService.getAllProducts();
    }

    @PostMapping("/seed")
    public ResponseEntity<String> seedInventoryPost() {
        String msg = inventoryService.seedDatabaseIfEmpty();
        return ResponseEntity.ok(msg);
    }

    @GetMapping("/seed")
    public ResponseEntity<String> seedInventoryGet() {
        String msg = inventoryService.seedDatabaseIfEmpty();
        return ResponseEntity.ok(msg);
    }

    private BatchResponse mapToBatchResponse(Batch batch) {
        // Dynamic discounting: discount if expiring in 48 hours or less
        boolean isDiscounted = false;
        if (batch.getExpiryDate() != null) {
            long hoursToExpiry = ChronoUnit.HOURS.between(LocalDateTime.now(), batch.getExpiryDate());
            isDiscounted = hoursToExpiry >= 0 && hoursToExpiry <= 48;
        }

        return BatchResponse.builder()
                .id(batch.getId())
                .productId(batch.getProduct().getId())
                .product(batch.getProduct().getName())
                .sku(batch.getProduct().getSku())
                .quantity(batch.getQuantityAvailable())
                .expiryDate(batch.getExpiryDate().toLocalDate())
                .status(batch.getStatus().name())
                .isDiscounted(isDiscounted)
                .build();
    }
}
