package com.luxegem.invoice.model;

import java.util.List;
import java.util.Map;

public record CreateDetailedInvoiceRequest(
        String customer,
        List<String> itemSKUs,
        Map<String, Integer> quantities,
        String type,
        String notes
) {}
