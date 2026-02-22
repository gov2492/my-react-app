package com.luxegem.invoice.model;

import java.util.List;

public record SalesReportResponse(
        SalesSummaryResponse summary,
        List<SalesTrendPointResponse> salesTrend,
        List<PaymentDistributionResponse> paymentDistribution,
        List<MetalSalesResponse> metalComparison,
        List<SalesReportRowResponse> rows,
        int page,
        int size,
        long totalElements,
        int totalPages) {
}
