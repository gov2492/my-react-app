package com.luxegem.invoice.model;

public record SalesSummaryResponse(
        double totalSalesAmount,
        long totalInvoices,
        double totalGstCollected,
        double totalGoldSoldGrams,
        double totalSilverSoldGrams) {
}
