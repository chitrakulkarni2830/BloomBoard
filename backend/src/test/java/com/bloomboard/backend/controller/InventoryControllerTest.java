package com.bloomboard.backend.controller;

import com.bloomboard.backend.controller.dto.BatchResponse;
import com.bloomboard.backend.domain.Batch;
import com.bloomboard.backend.domain.Product;
import com.bloomboard.backend.service.InventoryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryControllerTest {

    @Mock
    private InventoryService inventoryService;

    @InjectMocks
    private InventoryController inventoryController;

    @Test
    void testGetActiveBatches() {
        Product product = new Product();
        product.setId(UUID.randomUUID());
        product.setName("Red Rose");
        product.setSku("RSE-RED-01");

        Batch batch = new Batch();
        batch.setId(UUID.randomUUID());
        batch.setProduct(product);
        batch.setQuantityAvailable(150);
        batch.setExpiryDate(LocalDateTime.parse("2026-08-12T10:00:00"));
        batch.setStatus(Batch.BatchStatus.ACTIVE);

        when(inventoryService.getAllActiveBatches()).thenReturn(List.of(batch));

        List<BatchResponse> response = inventoryController.getAllBatches();

        assertEquals(1, response.size());
        BatchResponse dto = response.get(0);
        assertEquals(batch.getId(), dto.getId());
        assertEquals("Red Rose", dto.getProduct());
        assertEquals("RSE-RED-01", dto.getSku());
        assertEquals(150, dto.getQuantity());
        assertEquals("2026-08-12", dto.getExpiryDate().toString());
        assertEquals("ACTIVE", dto.getStatus());
    }
}
