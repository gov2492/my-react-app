package com.luxegem.market.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;

@Service
public class MarketDataService {

    private static final Logger logger = LoggerFactory.getLogger(MarketDataService.class);
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String COINGECKO_API = "https://api.coingecko.com/api/v3";
    private static final String METALS_API = "https://api.metals.live/v1/spot";

    public MarketDataService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Get cryptocurrency prices from CoinGecko
     */
    public Map<String, Object> getCryptoPrices() {
        try {
            String url = COINGECKO_API + "/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true";
            logger.debug("Fetching crypto prices from CoinGecko: {}", url);
            
            Map response = restTemplate.getForObject(url, Map.class);
            logger.info("Successfully fetched crypto prices");
            return response;
        } catch (Exception e) {
            logger.error("Failed to fetch crypto prices: {}", e.getMessage());
            return generateMockCryptoPrices();
        }
    }

    /**
     * Get precious metals prices
     */
    public Map<String, Object> getMetalsPrices() {
        try {
            String url = METALS_API + "/metals?metals=gold,silver,platinum";
            logger.debug("Fetching metals prices: {}", url);
            
            String response = restTemplate.getForObject(url, String.class);
            JsonNode jsonNode = objectMapper.readTree(response);
            
            Map<String, Object> result = new HashMap<>();
            JsonNode metals = jsonNode.get("metals");
            
            if (metals != null) {
                result.put("gold", metals.get("gold"));
                result.put("silver", metals.get("silver"));
                result.put("platinum", metals.get("platinum"));
            }
            
            logger.info("Successfully fetched metals prices");
            return result;
        } catch (Exception e) {
            logger.error("Failed to fetch metals prices: {}", e.getMessage());
            return generateMockMetalsPrices();
        }
    }

    /**
     * Get market overview with all rates
     */
    public Map<String, Object> getMarketOverview() {
        Map<String, Object> overview = new HashMap<>();
        
        try {
            // Fetch crypto prices
            Map<String, Object> cryptoPrices = getCryptoPrices();
            overview.put("cryptocurrencies", cryptoPrices);
            
            // Fetch metals prices
            Map<String, Object> metalsPrices = getMetalsPrices();
            overview.put("metals", metalsPrices);
            
            // Add market status
            overview.put("timestamp", System.currentTimeMillis());
            overview.put("status", "active");
            
            logger.info("Market overview generated successfully");
        } catch (Exception e) {
            logger.error("Error generating market overview: {}", e.getMessage());
            overview.put("error", "Failed to fetch real-time data");
            overview.put("data", generateMockMarketData());
        }
        
        return overview;
    }

    /**
     * Get specific product market rates
     */
    public Map<String, Object> getProductRates(String productType) {
        Map<String, Object> rates = new HashMap<>();
        
        switch (productType.toLowerCase()) {
            case "diamond":
                rates = getDiamondRates();
                break;
            case "gold":
                rates = getGoldRates();
                break;
            case "silver":
                rates = getSilverRates();
                break;
            case "platinum":
                rates = getPlatinumRates();
                break;
            case "crypto":
                rates = getCryptoPrices();
                break;
            default:
                rates = getMarketOverview();
        }
        
        return rates;
    }

    private Map<String, Object> getDiamondRates() {
        try {
            // Diamond prices vary by carat, color, clarity
            Map<String, Object> rates = new HashMap<>();
            rates.put("1carat_price_usd", 3500 + Math.random() * 1000);
            rates.put("2carat_price_usd", 8000 + Math.random() * 2000);
            rates.put("5carat_price_usd", 25000 + Math.random() * 5000);
            rates.put("currency", "USD");
            rates.put("updated_at", System.currentTimeMillis());
            rates.put("quality", "Premium");
            logger.debug("Generated diamond rates");
            return rates;
        } catch (Exception e) {
            logger.error("Error fetching diamond rates: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    private Map<String, Object> getGoldRates() {
        try {
            Map<String, Object> metalsPrices = getMetalsPrices();
            Map<String, Object> result = new HashMap<>();
            
            if (metalsPrices.containsKey("gold")) {
                result.put("gold", metalsPrices.get("gold"));
            } else {
                result.put("price_per_oz_usd", 2000 + Math.random() * 100);
            }
            
            result.put("currency", "USD");
            result.put("unit", "per ounce");
            result.put("updated_at", System.currentTimeMillis());
            logger.debug("Generated gold rates");
            return result;
        } catch (Exception e) {
            logger.error("Error fetching gold rates: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    private Map<String, Object> getSilverRates() {
        try {
            Map<String, Object> metalsPrices = getMetalsPrices();
            Map<String, Object> result = new HashMap<>();
            
            if (metalsPrices.containsKey("silver")) {
                result.put("silver", metalsPrices.get("silver"));
            } else {
                result.put("price_per_oz_usd", 25 + Math.random() * 5);
            }
            
            result.put("currency", "USD");
            result.put("unit", "per ounce");
            result.put("updated_at", System.currentTimeMillis());
            logger.debug("Generated silver rates");
            return result;
        } catch (Exception e) {
            logger.error("Error fetching silver rates: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    private Map<String, Object> getPlatinumRates() {
        try {
            Map<String, Object> metalsPrices = getMetalsPrices();
            Map<String, Object> result = new HashMap<>();
            
            if (metalsPrices.containsKey("platinum")) {
                result.put("platinum", metalsPrices.get("platinum"));
            } else {
                result.put("price_per_oz_usd", 1000 + Math.random() * 200);
            }
            
            result.put("currency", "USD");
            result.put("unit", "per ounce");
            result.put("updated_at", System.currentTimeMillis());
            logger.debug("Generated platinum rates");
            return result;
        } catch (Exception e) {
            logger.error("Error fetching platinum rates: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    private Map<String, Object> generateMockCryptoPrices() {
        Map<String, Object> mock = new HashMap<>();
        mock.put("bitcoin", Map.of("usd", 42500.0, "market_cap", 835000000000.0));
        mock.put("ethereum", Map.of("usd", 2250.0, "market_cap", 270000000000.0));
        return mock;
    }

    private Map<String, Object> generateMockMetalsPrices() {
        Map<String, Object> mock = new HashMap<>();
        mock.put("gold", 2050.0);
        mock.put("silver", 25.50);
        mock.put("platinum", 1050.0);
        return mock;
    }

    private Map<String, Object> generateMockMarketData() {
        Map<String, Object> mock = new HashMap<>();
        mock.put("cryptocurrencies", generateMockCryptoPrices());
        mock.put("metals", generateMockMetalsPrices());
        mock.put("diamonds", Map.of("price", 3500.0));
        return mock;
    }
}
