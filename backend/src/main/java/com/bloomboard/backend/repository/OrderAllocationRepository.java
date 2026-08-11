package com.bloomboard.backend.repository;

import com.bloomboard.backend.domain.OrderAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OrderAllocationRepository extends JpaRepository<OrderAllocation, UUID> {
}
