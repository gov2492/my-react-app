package com.luxegem.dashboard.model;

public record OverviewResponse(String date, double revenue, double revenueDeltaPercent, int pendingInvoices) {
}
