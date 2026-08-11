package com.bloomboard.backend.controller;

import com.bloomboard.backend.controller.dto.ReserveProductRequest;
import com.bloomboard.backend.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping("/{cartId}")
    public ResponseEntity<Void> reserveProduct(
            @PathVariable UUID cartId,
            @Valid @RequestBody ReserveProductRequest request) {
        
        reservationService.reserveProduct(cartId, request.productId(), request.quantity(), 15);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{cartId}")
    public ResponseEntity<Map<UUID, Integer>> getReservation(@PathVariable UUID cartId) {
        return ResponseEntity.ok(reservationService.getReservation(cartId));
    }

    @DeleteMapping("/{cartId}")
    public ResponseEntity<Void> clearReservation(@PathVariable UUID cartId) {
        reservationService.clearReservation(cartId);
        return ResponseEntity.noContent().build();
    }
}
