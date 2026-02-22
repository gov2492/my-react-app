package com.luxegem.invoice.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public record CreateInvoiceRequest(
        @NotBlank String customer,
        String mobilenumber,
        String address,
        @NotNull List<InvoiceItemDto> items,
        @NotBlank @Pattern(regexp = "GOLD_18K|GOLD_22K|GOLD_24K|SILVER|PLATINUM|DIAMOND|OTHER") String type,
        @NotNull @DecimalMin("0.01") Double amount,
        @NotBlank String status,
        @NotNull @DecimalMin("0.00") Double grossAmount,
        @NotNull @DecimalMin("0.00") Double netAmount,
        @NotNull @DecimalMin("0.00") Double discount,
        @NotNull @DecimalMin("0.00") Double makingCharge,
        @NotNull @DecimalMin("0.00") Double gstRate,
        String paymentMethod) {
}
