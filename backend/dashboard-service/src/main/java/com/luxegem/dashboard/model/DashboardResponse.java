package com.luxegem.dashboard.model;

import java.util.List;

public record DashboardResponse(
        OverviewResponse overview,
        List<MarketRateResponse> marketRates,
        List<InvoiceResponse> invoices,
        List<SalesCategoryResponse> salesByCategory,
        List<StockAlertResponse> stockAlerts
) {
}
