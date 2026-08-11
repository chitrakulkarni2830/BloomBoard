package com.bloomboard.backend.service;

import com.bloomboard.backend.domain.Batch;
import com.bloomboard.backend.domain.Product;
import com.bloomboard.backend.repository.BatchRepository;
import com.bloomboard.backend.service.dto.BatchAllocationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private BatchRepository batchRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private Product testProduct;
    private UUID productId;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        testProduct = new Product();
        testProduct.setId(productId);
    }

    @Test
    void testAllocateFefo_InsufficientStock() {
        when(batchRepository.findActiveBatchesForProductOrderByExpiry(eq(productId), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        BatchAllocationResult result = inventoryService.allocateFefo(productId, 10);

        assertFalse(result.isSuccessful());
        assertEquals("Insufficient stock. Only 0 available.", result.getErrorMessage());
    }

    @Test
    void testAllocateFefo_SuccessfulSplitAcrossBatches() {
        Batch batch1 = new Batch();
        batch1.setId(UUID.randomUUID());
        batch1.setQuantityAvailable(20);
        batch1.setExpiryDate(LocalDateTime.now().plusDays(2));

        Batch batch2 = new Batch();
        batch2.setId(UUID.randomUUID());
        batch2.setQuantityAvailable(30);
        batch2.setExpiryDate(LocalDateTime.now().plusDays(5));

        List<Batch> activeBatches = Arrays.asList(batch1, batch2);

        when(batchRepository.findActiveBatchesForProductOrderByExpiry(eq(productId), any(LocalDateTime.class)))
                .thenReturn(activeBatches);

        BatchAllocationResult result = inventoryService.allocateFefo(productId, 35);

        assertTrue(result.isSuccessful());
        assertEquals(2, result.getAllocatedBatches().size());
        assertEquals(20, result.getAllocatedBatches().get(batch1));
        assertEquals(15, result.getAllocatedBatches().get(batch2));
    }

    @Test
    void testWasteBatch() {
        UUID batchId = UUID.randomUUID();
        Batch batch = new Batch();
        batch.setId(batchId);
        batch.setQuantityAvailable(10);
        batch.setStatus(Batch.BatchStatus.ACTIVE);

        when(batchRepository.findById(batchId)).thenReturn(Optional.of(batch));
        when(batchRepository.save(any(Batch.class))).thenAnswer(i -> i.getArguments()[0]);

        inventoryService.wasteBatch(batchId);

        assertEquals(0, batch.getQuantityAvailable());
        assertEquals(Batch.BatchStatus.DISCARDED, batch.getStatus());
    }
}
