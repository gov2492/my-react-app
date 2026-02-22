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

import java.time.LocalDate;
import java.util.List;

@Service
public class DashboardAggregationService {

        private final WebClient invoiceClient;
        private final WebClient marketClient;

        public DashboardAggregationService(
                        @Qualifier("invoiceWebClient") WebClient invoiceClient,
                        @Qualifier("marketWebClient") WebClient marketClient) {
                this.invoiceClient = invoiceClient;
                this.marketClient = marketClient;
        }

        public DashboardResponse getDashboard(String authorizationHeader) {
                OverviewResponse overview = new OverviewResponse(LocalDate.now().toString(), 0.0, 0, 0);
                try {
                        overview = invoiceClient.get()
                                        .uri("/api/invoices/overview")
                                        .header("Authorization", authorizationHeader)
                                        .retrieve()
                                        .bodyToMono(OverviewResponse.class)
                                        .block();
                } catch (Exception e) {
                }

                List<InvoiceResponse> invoices = List.of();
                try {
                        invoices = invoiceClient.get()
                                        .uri("/api/invoices/recent")
                                        .header("Authorization", authorizationHeader)
                                        .retrieve()
                                        .bodyToMono(new org.springframework.core.ParameterizedTypeReference<List<InvoiceResponse>>() {
                                        })
                                        .block();
                } catch (Exception e) {
                }

                List<MarketRateResponse> rates = List.of();
                try {
                        rates = marketClient.get()
                                        .uri("/api/market/rates")
                                        .header("Authorization", authorizationHeader)
                                        .retrieve()
                                        .bodyToMono(new org.springframework.core.ParameterizedTypeReference<List<MarketRateResponse>>() {
                                        })
                                        .block();
                } catch (Exception e) {
                }

                List<SalesCategoryResponse> categories = List.of();
                try {
                        categories = marketClient.get()
                                        .uri("/api/market/sales-categories")
                                        .header("Authorization", authorizationHeader)
                                        .retrieve()
                                        .bodyToMono(new org.springframework.core.ParameterizedTypeReference<List<SalesCategoryResponse>>() {
                                        })
                                        .block();
                } catch (Exception e) {
                }

                List<StockAlertResponse> alerts = List.of();
                try {
                        alerts = marketClient.get()
                                        .uri("/api/market/stock-alerts")
                                        .header("Authorization", authorizationHeader)
                                        .retrieve()
                                        .bodyToFlux(StockAlertResponse.class)
                                        .collectList()
                                        .block();
                } catch (Exception e) {
                }

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
                                .bodyToMono(new ParameterizedTypeReference<List<InventoryResponse>>() {
                                })
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
