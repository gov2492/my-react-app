package com.luxegem.dashboard.model;

public record MetalSalesResponse(
        String metalType,
        double amount,
        double totalWeightGrams) {
}
