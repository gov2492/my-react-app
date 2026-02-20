package com.luxegem.market.model;

public record MarketRateResponse(
        String metal,
        double pricePerGram,
        String unit,
        String currency,
        double changePercent
) {
}
