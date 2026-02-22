package com.luxegem.dashboard.model;

public record InventoryResponse(
                String itemCode,
                String itemName,
                String category,
                String metalType,
                String purity,
                String description,
                String updatedAt,
                String createdAt) {
}
