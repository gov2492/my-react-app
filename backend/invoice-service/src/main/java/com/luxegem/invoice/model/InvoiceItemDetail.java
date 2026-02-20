package com.luxegem.invoice.model;

public record InvoiceItemDetail(
        String sku,
        String itemName,
        String type,
        double weightGrams,
        int quantity,
        double unitPrice,
        double lineTotal
) {}
