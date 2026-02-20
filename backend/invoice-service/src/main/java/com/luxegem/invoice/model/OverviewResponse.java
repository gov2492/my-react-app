package com.luxegem.invoice.model;

public record OverviewResponse(String date, double revenue, double revenueDeltaPercent, int pendingInvoices) {
}
