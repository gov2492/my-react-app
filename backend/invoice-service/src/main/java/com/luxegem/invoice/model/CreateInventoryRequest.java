package com.luxegem.invoice.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateInventoryRequest(
        String itemCode,
        @NotBlank String itemName,
        @NotBlank String category,
        @NotBlank String metalType,
        String purity,
        Double grossWeight,
        Double netWeight,
        Double makingCharge,
        Double ratePerGram,
        Integer stockQuantity,
        String hsnCode,
        String description) {
}
