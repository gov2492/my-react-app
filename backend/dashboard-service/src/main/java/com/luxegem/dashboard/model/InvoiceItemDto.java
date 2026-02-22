package com.luxegem.dashboard.model;

public record InvoiceItemDto(
        String description,
        String type,
        Double weight,
        Double rate,
        Double makingChargePercent,
        Double gstRatePercent) {
}
