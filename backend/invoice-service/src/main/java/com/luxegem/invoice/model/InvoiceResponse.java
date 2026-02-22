package com.luxegem.invoice.model;

import java.util.List;
import java.time.LocalDateTime;

public record InvoiceResponse(
                String invoiceId,
                String customer,
                String mobilenumber,
                String address,
                List<InvoiceItemDto> items,
                String type,
                double amount,
                String status,
                double grossAmount,
                double netAmount,
                double discount,
                double makingCharge,
                double gstRate,
                String paymentMethod,
                LocalDateTime createdAt) {
        }
        String mobilenumber,
        String address,
        List<InvoiceItemDto> items,
                        String type,
        double amount,
                        String status,
        double grossAmount,
        double netAmount,
        double discount,
        double makingCharge,
        double gstRate,
                        String paymentMethod){
}
