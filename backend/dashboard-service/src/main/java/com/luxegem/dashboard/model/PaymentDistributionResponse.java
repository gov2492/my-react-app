package com.luxegem.dashboard.model;

public record PaymentDistributionResponse(
        String paymentMethod,
        double amount,
        long invoiceCount) {
}
