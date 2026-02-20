package com.luxegem.invoice.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CreateInventoryRequest(
        String sku,
        @NotBlank String itemName,
        @NotBlank
        @Pattern(regexp = "GOLD_18K|GOLD_22K|GOLD_24K|SILVER|PLATINUM|DIAMOND|OTHER")
        String type,
        @NotNull @DecimalMin("0.001") Double weightGrams,
        @NotNull @Min(0) Integer quantity,
        @NotNull @DecimalMin("0.01") Double unitPrice,
        @NotNull @Min(0) Integer lowStockThreshold
) {
}
