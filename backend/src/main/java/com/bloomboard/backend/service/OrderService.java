package com.bloomboard.backend.service;

import com.bloomboard.backend.domain.*;
import com.bloomboard.backend.repository.BatchRepository;
import com.bloomboard.backend.repository.BouquetRepository;
import com.bloomboard.backend.repository.OrderAllocationRepository;
import com.bloomboard.backend.repository.OrderItemRepository;
import com.bloomboard.backend.repository.OrderRepository;
import com.bloomboard.backend.repository.ProductRepository;
import com.bloomboard.backend.service.dto.BatchAllocationResult;
import com.bloomboard.backend.service.dto.CheckoutItem;
import com.bloomboard.backend.service.dto.CheckoutRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderAllocationRepository orderAllocationRepository;
    private final BouquetRepository bouquetRepository;
    private final BatchRepository batchRepository;
    
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final ReservationService reservationService;

    @Transactional
    public Order processCheckout(CheckoutRequest request) {
        log.info("Processing checkout for cart ID: {}", request.cartId());
        
        Map<UUID, Integer> reservedProducts = reservationService.getReservation(request.cartId());
        if (reservedProducts.isEmpty()) {
            log.info("No pre-existing Redis reservation found for cart {}, creating instant 10m reservation", request.cartId());
            for (CheckoutItem item : request.items()) {
                if (item.productId() != null) {
                    reservationService.reserveProduct(request.cartId(), item.productId(), item.quantity(), 10);
                }
            }
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CheckoutItem item : request.items()) {
            totalAmount = totalAmount.add(item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())));
        }

        Order order = new Order();
        order.setCustomerEmail(request.customerEmail());
        order.setStatus(Order.OrderStatus.CONFIRMED);
        order.setTotalAmount(totalAmount);
        order.setDeliveryDate(request.deliveryDate());
        Order savedOrder = orderRepository.save(order);

        for (CheckoutItem itemRequest : request.items()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setQuantity(itemRequest.quantity());
            orderItem.setUnitPrice(itemRequest.unitPrice());

            if (itemRequest.bouquetId() != null) {
                Bouquet bouquet = bouquetRepository.findById(itemRequest.bouquetId())
                        .orElseThrow(() -> new IllegalArgumentException("Bouquet not found"));
                orderItem.setBouquet(bouquet);
                orderItem = orderItemRepository.save(orderItem);

                for (BouquetItem bi : bouquet.getItems()) {
                    int totalRawProductNeeded = bi.getQuantityRequired() * itemRequest.quantity();
                    allocateAndDeduct(bi.getProduct().getId(), totalRawProductNeeded, orderItem);
                }
            } else if (itemRequest.productId() != null) {
                Product product = productRepository.findById(itemRequest.productId())
                        .orElseThrow(() -> new IllegalArgumentException("Product not found: " + itemRequest.productId()));
                orderItem.setProduct(product);
                orderItem = orderItemRepository.save(orderItem);
                allocateAndDeduct(itemRequest.productId(), itemRequest.quantity(), orderItem);
            } else {
                throw new IllegalArgumentException("Checkout item must have either bouquetId or productId");
            }
        }

        reservationService.clearReservation(request.cartId());
        log.info("Successfully processed order {} for cart {}", savedOrder.getId(), request.cartId());
        
        return savedOrder;
    }

    private void allocateAndDeduct(UUID productId, int quantity, OrderItem orderItem) {
        BatchAllocationResult result = inventoryService.allocateFefo(productId, quantity);
        
        if (!result.isSuccessful()) {
            throw new IllegalStateException("Insufficient stock during checkout for product " + productId + ": " + result.getErrorMessage());
        }

        for (Map.Entry<Batch, Integer> entry : result.getAllocatedBatches().entrySet()) {
            Batch batch = entry.getKey();
            int allocatedQty = entry.getValue();

            batch.setQuantityAvailable(batch.getQuantityAvailable() - allocatedQty);
            if (batch.getQuantityAvailable() == 0) {
                batch.setStatus(Batch.BatchStatus.DEPLETED);
            }
            batchRepository.save(batch);

            OrderAllocation allocation = new OrderAllocation();
            allocation.setOrderItem(orderItem);
            allocation.setBatch(batch);
            allocation.setQuantityAllocated(allocatedQty);
            orderAllocationRepository.save(allocation);
        }
    }
}
