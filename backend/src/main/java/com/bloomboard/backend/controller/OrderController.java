package com.bloomboard.backend.controller;

import com.bloomboard.backend.controller.dto.ApiCheckoutRequest;
import com.bloomboard.backend.domain.Order;
import com.bloomboard.backend.service.OrderService;
import com.bloomboard.backend.service.dto.CheckoutItem;
import com.bloomboard.backend.service.dto.CheckoutRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    public ResponseEntity<OrderResponse> checkout(@Valid @RequestBody ApiCheckoutRequest request) {
        
        List<CheckoutItem> serviceItems = request.items().stream()
                .map(item -> new CheckoutItem(
                        item.bouquetId(),
                        item.productId(),
                        item.quantity(),
                        item.unitPrice()))
                .collect(Collectors.toList());

        CheckoutRequest serviceRequest = new CheckoutRequest(
                request.cartId(),
                request.customerEmail(),
                serviceItems
        );

        Order completedOrder = orderService.processCheckout(serviceRequest);
        
        OrderResponse response = new OrderResponse(completedOrder.getId(), completedOrder.getStatus().name());
        return ResponseEntity.ok(response);
    }
    
    public record OrderResponse(UUID orderId, String status) {}
}
