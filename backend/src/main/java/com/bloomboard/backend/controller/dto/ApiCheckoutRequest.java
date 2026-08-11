package com.bloomboard.backend.controller.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ApiCheckoutRequest(
    @NotNull(message = "Cart ID is required")
    UUID cartId,
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String customerEmail,
    
    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    List<ApiCheckoutItem> items
) {
    public record ApiCheckoutItem(
        UUID bouquetId,
        UUID productId,
        
        @NotNull(message = "Quantity is required")
        Integer quantity,
        
        @NotNull(message = "Unit price is required")
        BigDecimal unitPrice
    ) {}
}
