package com.bloomboard.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationService {

    private final StringRedisTemplate redisTemplate;
    private static final String RESERVATION_KEY_PREFIX = "reservation:";

    public void reserveProduct(UUID orderId, UUID productId, int quantity, long durationMinutes) {
        String key = RESERVATION_KEY_PREFIX + orderId.toString();
        
        redisTemplate.opsForHash().put(key, productId.toString(), String.valueOf(quantity));
        redisTemplate.expire(key, Duration.ofMinutes(durationMinutes));
        
        log.info("Reserved {} units of product {} for order {}", quantity, productId, orderId);
    }

    public Map<UUID, Integer> getReservation(UUID orderId) {
        String key = RESERVATION_KEY_PREFIX + orderId.toString();
        Map<Object, Object> rawHash = redisTemplate.opsForHash().entries(key);
        
        Map<UUID, Integer> result = new HashMap<>();
        for (Map.Entry<Object, Object> entry : rawHash.entrySet()) {
            UUID productId = UUID.fromString((String) entry.getKey());
            Integer quantity = Integer.parseInt((String) entry.getValue());
            result.put(productId, quantity);
        }
        
        return result;
    }

    public void clearReservation(UUID orderId) {
        String key = RESERVATION_KEY_PREFIX + orderId.toString();
        redisTemplate.delete(key);
        log.info("Cleared reservation for order {}", orderId);
    }
}
