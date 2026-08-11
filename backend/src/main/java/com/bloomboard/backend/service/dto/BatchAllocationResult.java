package com.bloomboard.backend.service.dto;

import com.bloomboard.backend.domain.Batch;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@Getter
@AllArgsConstructor
public class BatchAllocationResult {
    private boolean successful;
    private Map<Batch, Integer> allocatedBatches; // Maps Batch to quantity allocated
    private String errorMessage;
}
