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

                InventoryEntity inv1 = new InventoryEntity("AJ-INV-0001", "Gold Necklace Floral", "Necklace", "GOLD",
                                "22K", "Beautiful floral pattern.");
                inv1.setShopId("akash");
                InventoryEntity inv2 = new InventoryEntity("AJ-INV-0002", "Bridal Bangle Set", "Bangle", "GOLD", "22K", "Heavy bridal set.");
                inv2.setShopId("luxegem");
                InventoryEntity inv3 = new InventoryEntity("AJ-INV-0003", "Diamond Stud Earrings", "Earring", "GOLD",
                                "18K", "Classic diamond studs.");
                inv3.setShopId("royal");
                InventoryEntity inv4 = new InventoryEntity("AJ-INV-0004", "Silver Pooja Coin", "Coin", "SILVER", "99", "Pure silver coin.");
                inv4.setShopId("shree");
                InventoryEntity inv5 = new InventoryEntity("AJ-INV-0005", "Platinum Band Premium", "Ring", "PLATINUM",
                                "950", "Men's premium band.");
                inv5.setShopId("akash");

                inventoryRepository.saveAll(List.of(inv1, inv2, inv3, inv4, inv5));
        }
}
