package com.luxegem.invoice.model;

public record InventoryItemResponse(
                String itemCode,
                String itemName,
                String category,
                String metalType,
                String purity,
                String description) {
}
