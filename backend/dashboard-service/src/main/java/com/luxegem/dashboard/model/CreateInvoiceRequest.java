package com.luxegem.dashboard.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CreateInvoiceRequest(
        @NotBlank String customer,
        @NotBlank String items,
        @NotBlank
        @Pattern(regexp = "GOLD_18K|GOLD_22K|GOLD_24K|SILVER|PLATINUM|DIAMOND|OTHER")
        String type,
        @NotNull @DecimalMin("0.01") Double amount,
        @NotBlank String status
) {
}
