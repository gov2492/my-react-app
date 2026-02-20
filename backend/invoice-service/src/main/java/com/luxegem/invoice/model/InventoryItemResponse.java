package com.luxegem.invoice.model;

public record InventoryItemResponse(
        String sku,
        String itemName,
        String type,
        double weightGrams,
        int quantity,
        double unitPrice,
        int lowStockThreshold
) {}
