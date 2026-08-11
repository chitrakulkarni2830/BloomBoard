package com.bloomboard.backend.controller;

import com.bloomboard.backend.controller.dto.BatchResponse;
import com.bloomboard.backend.controller.dto.ReceiveBatchRequest;
import com.bloomboard.backend.domain.Batch;
import com.bloomboard.backend.domain.Product;
import com.bloomboard.backend.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allows React frontend to connect
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/batches")
    public List<BatchResponse> getActiveBatches() {
        List<Batch> batches = inventoryService.getAllActiveBatches();
        return batches.stream().map(this::mapToBatchResponse).collect(Collectors.toList());
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

    private BatchResponse mapToBatchResponse(Batch batch) {
        return BatchResponse.builder()
                .id(batch.getId())
                .product(batch.getProduct().getName())
                .sku(batch.getProduct().getSku())
                .quantity(batch.getQuantityAvailable())
                .expiryDate(batch.getExpiryDate().toLocalDate())
                .status(batch.getStatus().name())
                .build();
    }
}
