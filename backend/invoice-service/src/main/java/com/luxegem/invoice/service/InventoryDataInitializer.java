package com.luxegem.invoice.service;

import com.luxegem.invoice.entity.InventoryEntity;
import com.luxegem.invoice.repository.InventoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class InventoryDataInitializer implements CommandLineRunner {

        private final InventoryRepository inventoryRepository;

        public InventoryDataInitializer(InventoryRepository inventoryRepository) {
                this.inventoryRepository = inventoryRepository;
        }

        @Override
        public void run(String... args) {
                if (inventoryRepository.count() > 0) {
                        return;
                }

                InventoryEntity inv1 = new InventoryEntity("AJ-INV-0001", "Gold Necklace Floral", "GOLD_22K",
                                new BigDecimal("38.500"), 6, new BigDecimal("245000.00"), 2);
                inv1.setShopId("akash");
                InventoryEntity inv2 = new InventoryEntity("AJ-INV-0002", "Bridal Bangle Set", "GOLD_24K",
                                new BigDecimal("62.200"), 3, new BigDecimal("515000.00"), 1);
                inv2.setShopId("luxegem");
                InventoryEntity inv3 = new InventoryEntity("AJ-INV-0003", "Diamond Stud Earrings", "DIAMOND",
                                new BigDecimal("4.750"), 9, new BigDecimal("98500.00"), 3);
                inv3.setShopId("royal");
                InventoryEntity inv4 = new InventoryEntity("AJ-INV-0004", "Silver Pooja Coin", "SILVER",
                                new BigDecimal("20.000"), 25, new BigDecimal("2400.00"), 8);
                inv4.setShopId("shree");
                InventoryEntity inv5 = new InventoryEntity("AJ-INV-0005", "Platinum Band Premium", "PLATINUM",
                                new BigDecimal("9.400"), 4, new BigDecimal("72000.00"), 2);
                inv5.setShopId("akash");

                inventoryRepository.saveAll(List.of(inv1, inv2, inv3, inv4, inv5));
        }
}
