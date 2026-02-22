package com.luxegem.invoice.model;

public record SalesReportRowResponse(
        String invoiceNumber,
        String date,
        String customerName,
        String paymentMethod,
        String metalType,
        double totalWeight,
        double gst,
        double netAmount,
        String salesperson) {
}
