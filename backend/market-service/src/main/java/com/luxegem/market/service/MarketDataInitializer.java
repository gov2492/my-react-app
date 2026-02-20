package com.luxegem.market.service;

import com.luxegem.market.entity.MarketRateEntity;
import com.luxegem.market.entity.SalesCategoryEntity;
import com.luxegem.market.entity.StockAlertEntity;
import com.luxegem.market.repository.MarketRateRepository;
import com.luxegem.market.repository.SalesCategoryRepository;
import com.luxegem.market.repository.StockAlertRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MarketDataInitializer implements CommandLineRunner {

    private final MarketRateRepository marketRateRepository;
    private final SalesCategoryRepository salesCategoryRepository;
    private final StockAlertRepository stockAlertRepository;

    public MarketDataInitializer(
            MarketRateRepository marketRateRepository,
            SalesCategoryRepository salesCategoryRepository,
            StockAlertRepository stockAlertRepository
    ) {
        this.marketRateRepository = marketRateRepository;
        this.salesCategoryRepository = salesCategoryRepository;
        this.stockAlertRepository = stockAlertRepository;
    }

    @Override
    public void run(String... args) {
        boolean resetRates = marketRateRepository.count() < 4 ||
                marketRateRepository.findAll().stream().anyMatch(rate ->
                        rate.getUnit() == null || rate.getCurrency() == null);

        if (resetRates) {
            marketRateRepository.deleteAll();
            marketRateRepository.saveAll(List.of(
                    new MarketRateEntity("GOLD (24K)", 7485.00, "10g", "INR", 0.6),
                    new MarketRateEntity("GOLD (22K)", 6860.00, "10g", "INR", 0.4),
                    new MarketRateEntity("SILVER (999)", 92.00, "g", "INR", -0.2),
                    new MarketRateEntity("PLATINUM", 3650.00, "g", "INR", 0.3)
            ));
        }

        if (salesCategoryRepository.count() == 0) {
            salesCategoryRepository.saveAll(List.of(
                    new SalesCategoryEntity("Gold Jewelry", 62, 7890),
                    new SalesCategoryEntity("Diamond", 28, 3560),
                    new SalesCategoryEntity("Silver & Others", 10, 1000)
            ));
        }

        if (stockAlertRepository.count() == 0) {
            stockAlertRepository.saveAll(List.of(
                    new StockAlertEntity("Pearl Earring Set", "Only 2 left in stock", "Critical"),
                    new StockAlertEntity("Silver Charm Bracelet", "Low stock (5 left)", "Warning")
            ));
        }
    }
}
