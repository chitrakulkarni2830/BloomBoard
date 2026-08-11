package com.bloomboard.backend.controller.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class BatchResponse {
    private UUID id;
    private String product;
    private String sku;
    private Integer quantity;
    private LocalDate expiryDate;
    private String status;
    private Boolean isDiscounted;
}
