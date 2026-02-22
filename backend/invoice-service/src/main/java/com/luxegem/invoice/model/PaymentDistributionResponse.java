package com.luxegem.invoice.model;

public record PaymentDistributionResponse(
        String paymentMethod,
        double amount,
        long invoiceCount) {
}
