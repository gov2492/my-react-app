package com.luxegem.dashboard.controller;

import com.luxegem.dashboard.model.DashboardResponse;
import com.luxegem.dashboard.model.CreateInvoiceRequest;
import com.luxegem.dashboard.model.CreateInventoryRequest;
import com.luxegem.dashboard.model.CreateNotificationRequest;
import com.luxegem.dashboard.model.InvoiceResponse;
import com.luxegem.dashboard.model.InventoryResponse;
import com.luxegem.dashboard.model.MarkAllReadResponse;
import com.luxegem.dashboard.model.NotificationResponse;
import com.luxegem.dashboard.model.SalesReportResponse;
import com.luxegem.dashboard.model.UnreadCountResponse;
import com.luxegem.dashboard.service.DashboardAggregationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:5173")
@Tag(name = "Dashboard", description = "Dashboard aggregation API for managing invoices and inventory")
public class DashboardController {

    private static final Logger logger = LoggerFactory.getLogger(DashboardController.class);
    private final DashboardAggregationService dashboardAggregationService;

    public DashboardController(DashboardAggregationService dashboardAggregationService) {
        this.dashboardAggregationService = dashboardAggregationService;
    }

    @GetMapping("/overview")
    @Operation(summary = "Get Dashboard Overview", description = "Retrieves aggregated dashboard data including invoices and inventory")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dashboard overview retrieved successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = DashboardResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Missing or invalid authorization token"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public DashboardResponse overview(
            @Parameter(description = "JWT Bearer token for authentication", required = true)
            @RequestHeader("Authorization") String authorization) {
        logger.debug("Dashboard overview requested with Authorization header");
        if (authorization == null || authorization.isEmpty()) {
            logger.warn("Authorization header is empty");
        } else if (!authorization.startsWith("Bearer ")) {
            logger.warn("Authorization header does not start with 'Bearer '");
        }
        return dashboardAggregationService.getDashboard(authorization);
    }

    @PostMapping("/invoices")
    @Operation(summary = "Create Invoice", description = "Creates a new invoice through the aggregation service")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Invoice created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = InvoiceResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request body"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Missing or invalid authorization token"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public InvoiceResponse createInvoice(
            @Parameter(description = "JWT Bearer token for authentication", required = true)
            @RequestHeader("Authorization") String authorization,
            @Parameter(description = "Invoice creation request data", required = true)
            @Valid @RequestBody CreateInvoiceRequest request
    ) {
        logger.debug("Creating invoice with Authorization header");
        return dashboardAggregationService.createInvoice(authorization, request);
    }

    @GetMapping("/inventory")
    @Operation(summary = "List Inventory", description = "Retrieves a list of inventory items, optionally filtered by query parameter")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Inventory list retrieved successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = InventoryResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Missing or invalid authorization token"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public List<InventoryResponse> listInventory(
            @Parameter(description = "JWT Bearer token for authentication", required = true)
            @RequestHeader("Authorization") String authorization,
            @Parameter(description = "Search query to filter inventory items", required = false)
            @RequestParam(required = false) String q
    ) {
        logger.debug("Listing inventory with Authorization header, query: {}", q);
        return dashboardAggregationService.listInventory(authorization, q);
    }

    @PostMapping("/inventory")
    @Operation(summary = "Create Inventory", description = "Creates a new inventory item through the aggregation service")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Inventory item created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = InventoryResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request body"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Missing or invalid authorization token"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public InventoryResponse createInventory(
            @Parameter(description = "JWT Bearer token for authentication", required = true)
            @RequestHeader("Authorization") String authorization,
            @Parameter(description = "Inventory creation request data", required = true)
            @Valid @RequestBody CreateInventoryRequest request
    ) {
        logger.debug("Creating inventory with Authorization header");
        return dashboardAggregationService.createInventory(authorization, request);
    }

    @GetMapping("/reports/sales")
    public SalesReportResponse salesReport(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(defaultValue = "THIS_MONTH") String dateFilter,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String metalType,
            @RequestParam(required = false) String salesperson,
            @RequestParam(required = false) Double minAmount,
            @RequestParam(required = false) Double maxAmount,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return dashboardAggregationService.getSalesReport(
                authorization,
                dateFilter,
                from,
                to,
                search,
                paymentMethod,
                metalType,
                salesperson,
                minAmount,
                maxAmount,
                page,
                size,
                sortBy,
                sortDir);
    }

    @GetMapping("/notifications")
    public List<NotificationResponse> listNotifications(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(defaultValue = "50") int limit) {
        return dashboardAggregationService.listNotifications(authorization, limit);
    }

    @GetMapping("/notifications/unread-count")
    public UnreadCountResponse unreadCount(
            @RequestHeader("Authorization") String authorization) {
        return dashboardAggregationService.unreadCount(authorization);
    }

    @PatchMapping("/notifications/{id}/read")
    public NotificationResponse markNotificationRead(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id) {
        return dashboardAggregationService.markNotificationRead(authorization, id);
    }

    @PatchMapping("/notifications/read-all")
    public MarkAllReadResponse markAllNotificationsRead(
            @RequestHeader("Authorization") String authorization) {
        return dashboardAggregationService.markAllNotificationsRead(authorization);
    }

    @PostMapping("/notifications")
    public NotificationResponse createNotification(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody CreateNotificationRequest request) {
        return dashboardAggregationService.createNotification(authorization, request);
    }
}
