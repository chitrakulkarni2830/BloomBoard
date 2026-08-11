package com.bloomboard.backend.service.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CheckoutItem(
    UUID bouquetId,
    UUID productId,
    int quantity,
    BigDecimal unitPrice
) {}
