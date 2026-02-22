package com.luxegem.invoice.model;

public record SalesTrendPointResponse(
        String label,
        double amount,
        long invoiceCount) {
}
