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
                serviceItems,
                request.deliveryDate()
        );

        Order completedOrder = orderService.processCheckout(serviceRequest);
        
        OrderResponse response = new OrderResponse(completedOrder.getId(), completedOrder.getStatus().name());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<CustomerOrderResponse>> getMyOrders(@RequestParam String email) {
        List<CustomerOrderResponse> responseList = orderService.getOrdersForCustomer(email).stream()
                .map(o -> new CustomerOrderResponse(
                        o.getId(),
                        o.getStatus().name(),
                        o.getTotalAmount(),
                        o.getDeliveryDate() != null ? o.getDeliveryDate().toString() : null,
                        o.getCreatedAt() != null ? o.getCreatedAt().toString() : null
                ))
                .toList();
        return ResponseEntity.ok(responseList);
    }
    
    public record OrderResponse(UUID orderId, String status) {}
    public record CustomerOrderResponse(UUID orderId, String status, java.math.BigDecimal totalAmount, String deliveryDate, String createdAt) {}
}
