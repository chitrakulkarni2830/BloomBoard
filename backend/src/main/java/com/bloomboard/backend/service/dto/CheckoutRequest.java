package com.bloomboard.backend.service.dto;

import java.util.List;
import java.util.UUID;

public record CheckoutRequest(
    UUID cartId,
    String customerEmail,
    List<CheckoutItem> items
) {}
