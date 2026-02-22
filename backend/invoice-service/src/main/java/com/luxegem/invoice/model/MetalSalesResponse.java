package com.luxegem.invoice.model;

public record MetalSalesResponse(
        String metalType,
        double amount,
        double totalWeightGrams) {
}
