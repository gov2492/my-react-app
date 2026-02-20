package com.luxegem.invoice.model;

public record InvoiceResponse(
        String invoiceId,
        String customer,
        String items,
        String type,
        double amount,
        String status
) {
}
