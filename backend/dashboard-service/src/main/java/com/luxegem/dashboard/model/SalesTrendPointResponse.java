package com.luxegem.dashboard.model;

public record SalesTrendPointResponse(
        String label,
        double amount,
        long invoiceCount) {
}
