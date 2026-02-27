package com.luxegem.invoice.model;

import com.luxegem.invoice.market.model.MarketRateResponse;
import com.luxegem.invoice.market.model.SalesCategoryResponse;
import com.luxegem.invoice.market.model.StockAlertResponse;

import java.util.List;

public record DashboardResponse(
        OverviewResponse overview,
        List<MarketRateResponse> marketRates,
        List<InvoiceResponse> invoices,
        List<SalesCategoryResponse> salesByCategory,
        List<StockAlertResponse> stockAlerts) {
}
