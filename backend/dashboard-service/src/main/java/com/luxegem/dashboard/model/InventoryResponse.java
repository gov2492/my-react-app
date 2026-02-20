package com.luxegem.dashboard.model;

public record InventoryResponse(
        String sku,
        String itemName,
        String type,
        double weightGrams,
        int quantity,
        double unitPrice,
        int lowStockThreshold,
        String updatedAt
) {
}
