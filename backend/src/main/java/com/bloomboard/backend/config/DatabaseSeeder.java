package com.bloomboard.backend.config;

import com.bloomboard.backend.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final InventoryService inventoryService;

    @Override
    public void run(String... args) throws Exception {
        String result = inventoryService.seedDatabaseIfEmpty();
        log.info("DatabaseSeeder result: {}", result);
    }
}
