package com.luxegem.dashboard.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateInventoryRequest(
                String itemCode,
                @NotBlank String itemName,
                @NotBlank String category,
                @NotBlank String metalType,
                @NotBlank String purity,
                @NotNull @DecimalMin("0.001") Double grossWeight,
                Double netWeight,
                Double makingCharge,
                @NotNull @DecimalMin("0.01") Double ratePerGram,
                @NotNull @Min(0) Integer stockQuantity,
                String hsnCode,
                String description) {
}
