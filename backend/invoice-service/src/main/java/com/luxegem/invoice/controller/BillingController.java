package com.luxegem.invoice.controller;

import com.luxegem.invoice.model.CreateDetailedInvoiceRequest;
import com.luxegem.invoice.model.InvoiceDetailedResponse;
import com.luxegem.invoice.model.InventoryItemResponse;
import com.luxegem.invoice.service.BillingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private static final Logger logger = LoggerFactory.getLogger(BillingController.class);

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    /**
     * Create detailed invoice with items from inventory
     */
    @PostMapping("/invoices/detailed")
    @ResponseStatus(HttpStatus.CREATED)
    public InvoiceDetailedResponse createDetailedInvoice(
            @RequestBody CreateDetailedInvoiceRequest request) {
        logger.info("POST /api/billing/invoices/detailed - Creating detailed invoice for: {}", request.customer());
        return billingService.createDetailedInvoice(request);
    }

    /**
     * Get invoice details with itemized breakdown
     */
    @GetMapping("/invoices/{invoiceId}")
    public InvoiceDetailedResponse getInvoiceDetails(@PathVariable String invoiceId) {
        logger.info("GET /api/billing/invoices/{} - Fetching invoice details", invoiceId);
        return billingService.getInvoiceDetails(invoiceId);
    }

    /**
     * Get all available inventory items for billing
     */
    @GetMapping("/items/available")
    public List<InventoryItemResponse> getAvailableItems() {
        logger.info("GET /api/billing/items/available - Fetching all available items");
        return billingService.getAvailableItems();
    }

    /**
     * Search items by type (GOLD_18K, GOLD_22K, SILVER, DIAMOND, etc.)
     */
    @GetMapping("/items/search")
    public List<InventoryItemResponse> searchItemsByType(@RequestParam String type) {
        logger.info("GET /api/billing/items/search?type={} - Searching items by type", type);
        return billingService.searchItemsByType(type);
    }

    /**
     * Get low stock alert items
     */
    @GetMapping("/items/low-stock")
    public List<InventoryItemResponse> getLowStockItems() {
        logger.info("GET /api/billing/items/low-stock - Fetching low stock items");
        return billingService.getLowStockItems();
    }

    /**
     * Get billing statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> getBillingStats() {
        logger.info("GET /api/billing/stats - Fetching billing statistics");
        return Map.of(
                "totalItems", billingService.getAvailableItems().size(),
                "lowStockItems", billingService.getLowStockItems().size(),
                "timestamp", System.currentTimeMillis(),
                "status", "success"
        );
    }

    /**
     * Example request for creating detailed invoice
     * POST /api/billing/invoices/detailed
     * {
     *   "customer": "John Doe",
     *   "itemSKUs": ["SKU001", "SKU002"],
     *   "quantities": {"SKU001": 2, "SKU002": 1},
     *   "type": "GOLD_22K",
     *   "notes": "Custom order"
     * }
     */
    @PostMapping("/example")
    public Map<String, String> getExampleRequest() {
        logger.info("GET /api/billing/example - Returning example request");
        return Map.of(
                "example_endpoint", "POST /api/billing/invoices/detailed",
                "example_request", """
                        {
                          "customer": "John Doe",
                          "itemSKUs": ["SKU001", "SKU002"],
                          "quantities": {"SKU001": 2, "SKU002": 1},
                          "type": "GOLD_22K",
                          "notes": "Custom order"
                        }
                        """,
                "description", "Create invoice with detailed items from inventory"
        );
    }
}
