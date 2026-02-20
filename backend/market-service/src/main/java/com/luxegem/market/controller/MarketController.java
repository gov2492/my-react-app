package com.luxegem.market.controller;

import com.luxegem.market.model.MarketRateResponse;
import com.luxegem.market.model.SalesCategoryResponse;
import com.luxegem.market.model.StockAlertResponse;
import com.luxegem.market.repository.MarketRateRepository;
import com.luxegem.market.repository.SalesCategoryRepository;
import com.luxegem.market.repository.StockAlertRepository;
import com.luxegem.market.service.MarketDataService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market")
public class MarketController {

    private static final Logger logger = LoggerFactory.getLogger(MarketController.class);

    private final MarketRateRepository marketRateRepository;
    private final SalesCategoryRepository salesCategoryRepository;
    private final StockAlertRepository stockAlertRepository;
    private final MarketDataService marketDataService;

    public MarketController(
            MarketRateRepository marketRateRepository,
            SalesCategoryRepository salesCategoryRepository,
            StockAlertRepository stockAlertRepository,
            MarketDataService marketDataService
    ) {
        this.marketRateRepository = marketRateRepository;
        this.salesCategoryRepository = salesCategoryRepository;
        this.stockAlertRepository = stockAlertRepository;
        this.marketDataService = marketDataService;
    }

    @GetMapping("/rates")
    public List<MarketRateResponse> rates() {
        return marketRateRepository.findAll().stream()
                .map(rate -> new MarketRateResponse(
                        rate.getMetal(),
                        rate.getPricePerGram(),
                        rate.getUnit() == null ? "g" : rate.getUnit(),
                        rate.getCurrency() == null ? "INR" : rate.getCurrency(),
                        rate.getChangePercent()))
                .toList();
    }

    @GetMapping("/sales-categories")
    public List<SalesCategoryResponse> salesCategories() {
        return salesCategoryRepository.findAll().stream()
                .map(category -> new SalesCategoryResponse(category.getName(), category.getPercent(), category.getTotalSales()))
                .toList();
    }

    @GetMapping("/stock-alerts")
    public List<StockAlertResponse> stockAlerts() {
        return stockAlertRepository.findAll().stream()
                .map(alert -> new StockAlertResponse(alert.getItem(), alert.getNote(), alert.getLevel()))
                .toList();
    }

    // ========== REAL-TIME MARKET DATA ENDPOINTS ==========

    /**
     * Get real-time market overview from live APIs
     * Includes cryptocurrencies, precious metals, and diamonds
     */
    @GetMapping("/overview")
    public Map<String, Object> getMarketOverview() {
        logger.info("Fetching real-time market overview");
        return marketDataService.getMarketOverview();
    }

    /**
     * Get cryptocurrency prices from CoinGecko API
     * Returns: Bitcoin, Ethereum prices in USD with market cap
     */
    @GetMapping("/crypto")
    public Map<String, Object> getCryptoPrices() {
        logger.info("Fetching cryptocurrency prices");
        return marketDataService.getCryptoPrices();
    }

    /**
     * Get precious metals prices
     * Returns: Gold, Silver, Platinum prices per ounce
     */
    @GetMapping("/metals")
    public Map<String, Object> getMetalsPrices() {
        logger.info("Fetching precious metals prices");
        return marketDataService.getMetalsPrices();
    }

    /**
     * Get specific product market rates
     * @param product Type of product (diamond, gold, silver, platinum, crypto)
     */
    @GetMapping("/rates/{product}")
    public Map<String, Object> getProductRates(@PathVariable String product) {
        logger.info("Fetching market rates for product: {}", product);
        return marketDataService.getProductRates(product);
    }

    /**
     * Get diamond rates
     */
    @GetMapping("/rates/diamond")
    public Map<String, Object> getDiamondRates() {
        logger.info("Fetching diamond rates");
        return marketDataService.getProductRates("diamond");
    }

    /**
     * Get gold rates
     */
    @GetMapping("/rates/gold")
    public Map<String, Object> getGoldRates() {
        logger.info("Fetching gold rates");
        return marketDataService.getProductRates("gold");
    }

    /**
     * Get silver rates
     */
    @GetMapping("/rates/silver")
    public Map<String, Object> getSilverRates() {
        logger.info("Fetching silver rates");
        return marketDataService.getProductRates("silver");
    }

    /**
     * Get platinum rates
     */
    @GetMapping("/rates/platinum")
    public Map<String, Object> getPlatinumRates() {
        logger.info("Fetching platinum rates");
        return marketDataService.getProductRates("platinum");
    }
}
