package com.luxegem.dashboard.service;

import com.luxegem.dashboard.model.DashboardResponse;
import com.luxegem.dashboard.model.CreateInvoiceRequest;
import com.luxegem.dashboard.model.CreateInventoryRequest;
import com.luxegem.dashboard.model.InvoiceResponse;
import com.luxegem.dashboard.model.InventoryResponse;
import com.luxegem.dashboard.model.MarketRateResponse;
import com.luxegem.dashboard.model.OverviewResponse;
import com.luxegem.dashboard.model.SalesCategoryResponse;
import com.luxegem.dashboard.model.StockAlertResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Service
public class DashboardAggregationService {

    private final WebClient invoiceClient;
    private final WebClient marketClient;

    public DashboardAggregationService(
            @Qualifier("invoiceWebClient") WebClient invoiceClient,
            @Qualifier("marketWebClient") WebClient marketClient
    ) {
        this.invoiceClient = invoiceClient;
        this.marketClient = marketClient;
    }

    public DashboardResponse getDashboard(String authorizationHeader) {
        OverviewResponse overview = invoiceClient.get()
                .uri("/api/invoices/overview")
                .header("Authorization", authorizationHeader)
                .retrieve()
                .bodyToMono(OverviewResponse.class)
                .block();

        List<InvoiceResponse> invoices = invoiceClient.get()
                .uri("/api/invoices/recent")
                .header("Authorization", authorizationHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<InvoiceResponse>>() {})
                .block();

        List<MarketRateResponse> rates = marketClient.get()
                .uri("/api/market/rates")
                .header("Authorization", authorizationHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<MarketRateResponse>>() {})
                .block();

        List<SalesCategoryResponse> categories = marketClient.get()
                .uri("/api/market/sales-categories")
                .header("Authorization", authorizationHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<SalesCategoryResponse>>() {})
                .block();

        List<StockAlertResponse> alerts = marketClient.get()
                .uri("/api/market/stock-alerts")
                .header("Authorization", authorizationHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<StockAlertResponse>>() {})
                .block();

        return new DashboardResponse(overview, rates, invoices, categories, alerts);
    }

    public InvoiceResponse createInvoice(String authorizationHeader, CreateInvoiceRequest request) {
        return invoiceClient.post()
                .uri("/api/invoices")
                .header("Authorization", authorizationHeader)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(InvoiceResponse.class)
                .block();
    }

    public List<InventoryResponse> listInventory(String authorizationHeader, String query) {
        return invoiceClient.get()
                .uri(uriBuilder -> {
                    var builder = uriBuilder.path("/api/inventory");
                    if (query != null && !query.isBlank()) {
                        builder.queryParam("q", query);
                    }
                    return builder.build();
                })
                .header("Authorization", authorizationHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<InventoryResponse>>() {})
                .block();
    }

    public InventoryResponse createInventory(String authorizationHeader, CreateInventoryRequest request) {
        return invoiceClient.post()
                .uri("/api/inventory")
                .header("Authorization", authorizationHeader)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(InventoryResponse.class)
                .block();
    }
}
