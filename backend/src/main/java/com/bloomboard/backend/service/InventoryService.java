package com.bloomboard.backend.service;

import com.bloomboard.backend.domain.Batch;
import com.bloomboard.backend.repository.BatchRepository;
import com.bloomboard.backend.service.dto.BatchAllocationResult;
import com.bloomboard.backend.controller.dto.ReceiveBatchRequest;
import com.bloomboard.backend.domain.Product;
import com.bloomboard.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final BatchRepository batchRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public BatchAllocationResult allocateFefo(UUID productId, int quantityRequired) {
        log.info("Attempting FEFO allocation for product {} - quantity needed: {}", productId, quantityRequired);
        
        if (quantityRequired <= 0) {
            return new BatchAllocationResult(false, null, "Quantity required must be greater than 0");
        }

        List<Batch> activeBatches = batchRepository.findActiveBatchesForProductOrderByExpiry(productId, LocalDateTime.now());
        
        int totalAvailable = activeBatches.stream().mapToInt(Batch::getQuantityAvailable).sum();
        if (totalAvailable < quantityRequired) {
            log.warn("Insufficient stock for product {}. Needed: {}, Available: {}", productId, quantityRequired, totalAvailable);
            return new BatchAllocationResult(false, null, "Insufficient stock. Only " + totalAvailable + " available.");
        }

        Map<Batch, Integer> allocationMap = new HashMap<>();
        int remainingToAllocate = quantityRequired;

        for (Batch batch : activeBatches) {
            if (remainingToAllocate <= 0) {
                break;
            }

            int availableInBatch = batch.getQuantityAvailable();
            int amountToTake = Math.min(availableInBatch, remainingToAllocate);

            allocationMap.put(batch, amountToTake);
            remainingToAllocate -= amountToTake;
        }

        if (remainingToAllocate > 0) {
            return new BatchAllocationResult(false, null, "Failed to allocate complete quantity due to concurrent stock changes.");
        }

        log.info("Successfully allocated {} units across {} batches for product {}", quantityRequired, allocationMap.size(), productId);
        return new BatchAllocationResult(true, allocationMap, null);
    }

    @Transactional
    public void markExpiredBatches() {
        log.info("Running scheduled job: markExpiredBatches");
        List<Batch> expiredBatches = batchRepository.findByStatusAndExpiryDateBefore(
                Batch.BatchStatus.ACTIVE, LocalDateTime.now());
        
        for (Batch batch : expiredBatches) {
            log.info("Marking batch {} as EXPIRED", batch.getId());
            batch.setStatus(Batch.BatchStatus.EXPIRED);
        }
        batchRepository.saveAll(expiredBatches);
        log.info("Finished markExpiredBatches. Updated {} batches.", expiredBatches.size());
    }

    @Transactional(readOnly = true)
    public List<Batch> getAllActiveBatches() {
        return batchRepository.findAllActiveBatchesWithProductOrderByExpiryDateAsc();
    }

    @Transactional
    public Batch receiveNewBatch(ReceiveBatchRequest request) {
        log.info("Receiving new batch for product id: {}", request.getProductId());
        
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + request.getProductId()));

        Batch batch = new Batch();
        batch.setProduct(product);
        batch.setSupplierName(request.getSupplierName());
        batch.setQuantityInitial(request.getQuantity());
        batch.setQuantityAvailable(request.getQuantity());
        batch.setPurchasePrice(request.getPurchasePrice());
        batch.setReceivedDate(LocalDateTime.now());
        batch.setExpiryDate(request.getExpiryDate());
        batch.setStatus(Batch.BatchStatus.ACTIVE);

        return batchRepository.save(batch);
    }

    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Transactional
    public void wasteBatch(UUID batchId) {
        log.info("Marking batch {} as WASTED", batchId);
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Batch not found with id: " + batchId));
        
        batch.setStatus(Batch.BatchStatus.DISCARDED);
        batch.setQuantityAvailable(0);
        batchRepository.save(batch);
    }

    @Transactional
    public String seedDatabaseIfEmpty() {
        if (productRepository.count() > 0) {
            return "Already seeded with " + productRepository.count() + " products and " + batchRepository.count() + " batches.";
        }

        log.info("Seeding initial products and fresh flower inventory batches...");

        record ProductSeed(String sku, String name, String description, java.math.BigDecimal price, String supplier, int expiryDays) {}

        List<ProductSeed> seedData = List.of(
            new ProductSeed("FLW-ROSE", "Rose", "Fresh Crimson Red Dutch Roses", new java.math.BigDecimal("20.00"), "Bangalore Rose Gardens", 7),
            new ProductSeed("FLW-PEONY", "Peony", "Lush Pink Double Peonies", new java.math.BigDecimal("280.00"), "Ooty Alpine Imports", 5),
            new ProductSeed("FLW-TULIP", "Tulip", "Vibrant Dutch Yellow Tulips", new java.math.BigDecimal("150.00"), "Gultekdi Wholesale Pune", 6),
            new ProductSeed("FLW-ORCHID", "Orchid", "Exotic Purple Mokara Orchids", new java.math.BigDecimal("55.00"), "Kerala Orchid Farms", 10),
            new ProductSeed("FLW-LILY", "Lily", "Fragrant Stargazer Oriental Lilies", new java.math.BigDecimal("95.00"), "Mysore Lily Co", 8),
            new ProductSeed("FLW-CARN", "Carnation", "Soft Pastel Pink Carnations", new java.math.BigDecimal("25.00"), "Mahabaleshwar Flora", 1),
            new ProductSeed("FLW-GERB", "Gerbera", "Bright Orange Daisy Gerberas", new java.math.BigDecimal("20.00"), "Pune Agri Market", 6),
            new ProductSeed("FLW-CHRY", "Chrysanthemum", "Golden Yellow Button Chrysanthemums", new java.math.BigDecimal("20.00"), "Satara Flower Syndicate", 9),
            new ProductSeed("FLW-ANTH", "Anthurium", "Glossy Crimson Flamingo Anthuriums", new java.math.BigDecimal("50.00"), "Goa Tropical Blooms", 12),
            new ProductSeed("FLW-HYDR", "Hydrangea", "Sky Blue Mophead Hydrangeas", new java.math.BigDecimal("180.00"), "Kodaikanal Valley Nursery", 5),
            new ProductSeed("FLW-SNAP", "Snapdragon", "Tall Spike Pink Snapdragons", new java.math.BigDecimal("40.00"), "Nashik Floral Hub", 6),
            new ProductSeed("FLW-RANU", "Ranunculus", "Layered Buttercup Ranunculus", new java.math.BigDecimal("75.00"), "Himachal Bloom Imports", 7),
            new ProductSeed("FLW-BIRD", "Bird of Paradise", "Tropical Orange Strelitzia", new java.math.BigDecimal("85.00"), "Coorg Exotic Growers", 10),
            new ProductSeed("FLW-FREE", "Freesia", "Aromatic White Freesia Stems", new java.math.BigDecimal("50.00"), "Sikkim Alpine Farms", 1),
            new ProductSeed("FLW-GLAD", "Gladiolus", "Purple Sword-Lily Gladiolus", new java.math.BigDecimal("35.00"), "Solapur Gladiolus Co", 7),
            new ProductSeed("FLW-IRIS", "Iris", "Deep Violet Blue Bearded Irises", new java.math.BigDecimal("65.00"), "Gultekdi Violet Market", 6),
            new ProductSeed("FLW-LISI", "Lisianthus", "Rose-like Lavender Lisianthus", new java.math.BigDecimal("75.00"), "Lonavala Nursery", 8),
            new ProductSeed("FLW-ALST", "Alstroemeria", "Peruvian Lilies with Striped Petals", new java.math.BigDecimal("40.00"), "Pune Botanical Hub", 7),
            new ProductSeed("FLW-STCK", "Stock Flower", "Sweet Scented Cream Stock Flowers", new java.math.BigDecimal("45.00"), "Wai Cream Stock Farms", 6),
            new ProductSeed("FLW-SUNF", "Sunflower", "Radiant Golden Pune Sunflowers", new java.math.BigDecimal("40.00"), "Solapur Sunfields", 7)
        );

        List<Product> productsToSave = new java.util.ArrayList<>();
        for (ProductSeed seed : seedData) {
            Product p = new Product();
            p.setSku(seed.sku());
            p.setName(seed.name());
            p.setDescription(seed.description());
            productsToSave.add(p);
        }

        List<Product> savedProducts = productRepository.saveAll(productsToSave);

        List<Batch> batchesToSave = new java.util.ArrayList<>();
        for (int i = 0; i < savedProducts.size(); i++) {
            Product p = savedProducts.get(i);
            ProductSeed seed = seedData.get(i);

            Batch b = new Batch();
            b.setProduct(p);
            b.setSupplierName(seed.supplier());
            b.setQuantityInitial(150);
            b.setQuantityAvailable(150);
            b.setPurchasePrice(seed.price());
            b.setReceivedDate(LocalDateTime.now());
            b.setExpiryDate(LocalDateTime.now().plusDays(seed.expiryDays()));
            b.setStatus(Batch.BatchStatus.ACTIVE);
            batchesToSave.add(b);
        }

        List<Batch> savedBatches = batchRepository.saveAll(batchesToSave);

        return "Successfully seeded " + savedProducts.size() + " products and " + savedBatches.size() + " active inventory batches.";
    }
}
