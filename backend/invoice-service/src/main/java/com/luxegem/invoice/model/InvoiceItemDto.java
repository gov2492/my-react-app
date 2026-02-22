package com.luxegem.invoice.model;

public record InvoiceItemDto(
        String description,
        String type,
        Double weight,
        Double rate,
        Double makingChargePercent,
        Double gstRatePercent) {
}
