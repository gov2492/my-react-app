package com.luxegem.invoice.model;

import java.util.List;
import java.util.Map;

public record InvoiceDetailedResponse(
        String invoiceId,
        String customer,
        List<InvoiceItemDetail> items,
        String type,
        double subtotal,
        String status,
        String issueDate,
        Map<String, Object> taxAndTotal
) {}
