package com.bloomboard.backend.config;

import com.bloomboard.backend.domain.Batch;
import com.bloomboard.backend.domain.Product;
import com.bloomboard.backend.repository.BatchRepository;
import com.bloomboard.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final BatchRepository batchRepository;

    @Override
    public void run(String... args) throws Exception {
        if (productRepository.count() > 0) {
            log.info("Products already seeded (count: {}). Skipping DatabaseSeeder.", productRepository.count());
            return;
        }

        log.info("Seeding initial products and fresh flower inventory batches...");

        List<ProductSeed> seedData = List.of(
            new ProductSeed("FLW-ROSE", "Rose", "Fresh Crimson Red Dutch Roses", new BigDecimal("20.00"), "Bangalore Rose Gardens", 7),
            new ProductSeed("FLW-PEONY", "Peony", "Lush Pink Double Peonies", new BigDecimal("280.00"), "Ooty Alpine Imports", 5),
            new ProductSeed("FLW-TULIP", "Tulip", "Vibrant Dutch Yellow Tulips", new BigDecimal("150.00"), "Gultekdi Wholesale Pune", 6),
            new ProductSeed("FLW-ORCHID", "Orchid", "Exotic Purple Mokara Orchids", new BigDecimal("55.00"), "Kerala Orchid Farms", 10),
            new ProductSeed("FLW-LILY", "Lily", "Fragrant Stargazer Oriental Lilies", new BigDecimal("95.00"), "Mysore Lily Co", 8),
            new ProductSeed("FLW-CARN", "Carnation", "Soft Pastel Pink Carnations", new BigDecimal("25.00"), "Mahabaleshwar Flora", 1), // Near expiry for discount testing!
            new ProductSeed("FLW-GERB", "Gerbera", "Bright Orange Daisy Gerberas", new BigDecimal("20.00"), "Pune Agri Market", 6),
            new ProductSeed("FLW-CHRY", "Chrysanthemum", "Golden Yellow Button Chrysanthemums", new BigDecimal("20.00"), "Satara Flower Syndicate", 9),
            new ProductSeed("FLW-ANTH", "Anthurium", "Glossy Crimson Flamingo Anthuriums", new BigDecimal("50.00"), "Goa Tropical Blooms", 12),
            new ProductSeed("FLW-HYDR", "Hydrangea", "Sky Blue Mophead Hydrangeas", new BigDecimal("180.00"), "Kodaikanal Valley Nursery", 5),
            new ProductSeed("FLW-SNAP", "Snapdragon", "Tall Spike Pink Snapdragons", new BigDecimal("40.00"), "Nashik Floral Hub", 6),
            new ProductSeed("FLW-RANU", "Ranunculus", "Layered Buttercup Ranunculus", new BigDecimal("75.00"), "Himachal Bloom Imports", 7),
            new ProductSeed("FLW-BIRD", "Bird of Paradise", "Tropical Orange Strelitzia", new BigDecimal("85.00"), "Coorg Exotic Growers", 10),
            new ProductSeed("FLW-FREE", "Freesia", "Aromatic White Freesia Stems", new BigDecimal("50.00"), "Sikkim Alpine Farms", 1), // Near expiry for discount testing!
            new ProductSeed("FLW-GLAD", "Gladiolus", "Purple Sword-Lily Gladiolus", new BigDecimal("35.00"), "Solapur Gladiolus Co", 7),
            new ProductSeed("FLW-IRIS", "Iris", "Deep Violet Blue Bearded Irises", new BigDecimal("65.00"), "Gultekdi Violet Market", 6),
            new ProductSeed("FLW-LISI", "Lisianthus", "Rose-like Lavender Lisianthus", new BigDecimal("75.00"), "Lonavala Nursery", 8),
            new ProductSeed("FLW-ALST", "Alstroemeria", "Peruvian Lilies with Striped Petals", new BigDecimal("40.00"), "Pune Botanical Hub", 7),
            new ProductSeed("FLW-STCK", "Stock Flower", "Sweet Scented Cream Stock Flowers", new BigDecimal("45.00"), "Wai Cream Stock Farms", 6),
            new ProductSeed("FLW-SUNF", "Sunflower", "Radiant Golden Pune Sunflowers", new BigDecimal("40.00"), "Solapur Sunfields", 7)
        );

        List<Product> productsToSave = new ArrayList<>();
        for (ProductSeed seed : seedData) {
            Product p = new Product();
            p.setSku(seed.sku);
            p.setName(seed.name);
            p.setDescription(seed.description);
            productsToSave.add(p);
        }

        List<Product> savedProducts = productRepository.saveAll(productsToSave);
        log.info("Saved {} flower products.", savedProducts.size());

        List<Batch> batchesToSave = new ArrayList<>();
        for (int i = 0; i < savedProducts.size(); i++) {
            Product p = savedProducts.get(i);
            ProductSeed seed = seedData.get(i);

            Batch b = new Batch();
            b.setProduct(p);
            b.setSupplierName(seed.supplier);
            b.setQuantityInitial(150);
            b.setQuantityAvailable(150);
            b.setPurchasePrice(seed.price);
            b.setReceivedDate(LocalDateTime.now());
            b.setExpiryDate(LocalDateTime.now().plusDays(seed.expiryDays));
            b.setStatus(Batch.BatchStatus.ACTIVE);
            batchesToSave.add(b);
        }

        List<Batch> savedBatches = batchRepository.saveAll(batchesToSave);
        log.info("Saved {} fresh flower inventory batches.", savedBatches.size());
    }

    private record ProductSeed(
        String sku,
        String name,
        String description,
        BigDecimal price,
        String supplier,
        int expiryDays
    ) {}
}
