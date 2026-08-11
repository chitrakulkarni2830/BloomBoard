package com.bloomboard.backend.repository;

import com.bloomboard.backend.domain.Batch;
import com.bloomboard.backend.domain.Batch.BatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BatchRepository extends JpaRepository<Batch, UUID> {
    
    @Query("SELECT b FROM Batch b WHERE b.product.id = :productId AND b.status = 'ACTIVE' AND b.quantityAvailable > 0 AND b.expiryDate > :currentDate ORDER BY b.expiryDate ASC")
    List<Batch> findActiveBatchesForProductOrderByExpiry(
            @Param("productId") UUID productId, 
            @Param("currentDate") LocalDateTime currentDate
    );
    
    List<Batch> findByStatusAndExpiryDateBefore(BatchStatus status, LocalDateTime date);

    @Query("SELECT b FROM Batch b JOIN FETCH b.product WHERE b.status = 'ACTIVE' ORDER BY b.expiryDate ASC")
    List<Batch> findAllActiveBatchesWithProductOrderByExpiryDateAsc();
}
