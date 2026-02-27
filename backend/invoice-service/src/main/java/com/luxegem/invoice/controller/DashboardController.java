package com.luxegem.invoice.controller;

import com.luxegem.invoice.entity.InvoiceEntity;
import com.luxegem.invoice.model.*;
import com.luxegem.invoice.repository.InvoiceRepository;
import com.luxegem.invoice.service.NotificationService;
import com.luxegem.invoice.service.SalesReportService;
import com.luxegem.invoice.market.model.MarketRateResponse;
import com.luxegem.invoice.market.model.SalesCategoryResponse;
import com.luxegem.invoice.market.model.StockAlertResponse;
import com.luxegem.invoice.market.repository.MarketRateRepository;
import com.luxegem.invoice.market.repository.SalesCategoryRepository;
import com.luxegem.invoice.market.repository.StockAlertRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

/**
 * Unified dashboard controller that aggregates data from all local services.
 * Replaces the old WebClient-based DashboardAggregationService.
 * API paths match the original gateway-based dashboard-service exactly.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private static final Logger logger = LoggerFactory.getLogger(DashboardController.class);

    private final InvoiceRepository invoiceRepository;
    private final MarketRateRepository marketRateRepository;
    private final SalesCategoryRepository salesCategoryRepository;
    private final StockAlertRepository stockAlertRepository;
    private final NotificationService notificationService;
    private final SalesReportService salesReportService;

    public DashboardController(
            InvoiceRepository invoiceRepository,
            MarketRateRepository marketRateRepository,
            SalesCategoryRepository salesCategoryRepository,
            StockAlertRepository stockAlertRepository,
            NotificationService notificationService,
            SalesReportService salesReportService) {
        this.invoiceRepository = invoiceRepository;
        this.marketRateRepository = marketRateRepository;
        this.salesCategoryRepository = salesCategoryRepository;
        this.stockAlertRepository = stockAlertRepository;
        this.notificationService = notificationService;
        this.salesReportService = salesReportService;
    }

    // ========== OVERVIEW ==========

    @GetMapping("/overview")
    public DashboardResponse overview(Principal principal) {
        String shopId = principal != null ? principal.getName() : "admin";
        logger.debug("Dashboard overview requested for shopId: {}", shopId);

        // Overview stats
        OverviewResponse overviewData = buildOverview(shopId);

        // Recent invoices
        List<InvoiceResponse> invoices = buildRecentInvoices(shopId);

        // Market rates
        List<MarketRateResponse> rates = marketRateRepository.findAll().stream()
                .map(rate -> new MarketRateResponse(
                        rate.getMetal(),
                        rate.getPricePerGram(),
                        rate.getUnit() == null ? "g" : rate.getUnit(),
                        rate.getCurrency() == null ? "INR" : rate.getCurrency(),
                        rate.getChangePercent()))
                .toList();

        // Sales categories
        List<SalesCategoryResponse> categories = salesCategoryRepository.findAll().stream()
                .map(cat -> new SalesCategoryResponse(cat.getName(), cat.getPercent(), cat.getTotalSales()))
                .toList();

        // Stock alerts
        List<StockAlertResponse> alerts = stockAlertRepository.findAll().stream()
                .map(alert -> new StockAlertResponse(alert.getItem(), alert.getNote(), alert.getLevel()))
                .toList();

        return new DashboardResponse(overviewData, rates, invoices, categories, alerts);
    }

    // ========== INVOICES ==========

    @PostMapping("/invoices")
    public InvoiceResponse createInvoice(@Valid @RequestBody CreateInvoiceRequest request, Principal principal) {
        long lastId = invoiceRepository.findTopByOrderByIdDesc()
                .map(InvoiceEntity::getId)
                .orElse(0L);
        String invoiceId = String.format("#INV-%d", lastId + 1);
        InvoiceEntity entity = new InvoiceEntity(
                invoiceId,
                request.customer(),
                request.mobilenumber(),
                request.address(),
                request.items(),
                request.type(),
                BigDecimal.valueOf(request.amount()),
                request.status(),
                LocalDate.now(),
                BigDecimal.valueOf(request.grossAmount()),
                BigDecimal.valueOf(request.netAmount()),
                BigDecimal.valueOf(request.discount()),
                BigDecimal.valueOf(request.makingCharge()),
                BigDecimal.valueOf(request.gstRate()),
                request.paymentMethod() == null ? "CASH" : request.paymentMethod());

        String shopId = principal != null ? principal.getName() : "admin";
        entity.setShopId(shopId);
        invoiceRepository.save(entity);
        notificationService.createSystemNotification(
                shopId,
                "Invoice created successfully",
                String.format("%s created for %s", invoiceId, request.customer()),
                NotificationType.SUCCESS);
        return toInvoiceResponse(entity);
    }

    // ========== SALES REPORT ==========

    @GetMapping("/reports/sales")
    public SalesReportResponse salesReport(
            Principal principal,
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

        String shopId = principal != null ? principal.getName() : "admin";
        return salesReportService.getSalesReport(shopId, dateFilter, from, to, search,
                paymentMethod, metalType, salesperson, minAmount, maxAmount, page, size, sortBy, sortDir);
    }

    // ========== NOTIFICATIONS ==========

    @GetMapping("/notifications")
    public List<NotificationResponse> listNotifications(Principal principal,
            @RequestParam(defaultValue = "50") int limit) {
        String shopId = principal != null ? principal.getName() : "admin";
        String role = resolveRole(shopId);
        return notificationService.list(shopId, role, limit);
    }

    @GetMapping("/notifications/unread-count")
    public UnreadCountResponse unreadCount(Principal principal) {
        String shopId = principal != null ? principal.getName() : "admin";
        String role = resolveRole(shopId);
        long count = notificationService.unreadCount(shopId, role);
        return new UnreadCountResponse(count);
    }

    @PatchMapping("/notifications/{id}/read")
    public NotificationResponse markNotificationRead(Principal principal, @PathVariable Long id) {
        String shopId = principal != null ? principal.getName() : "admin";
        String role = resolveRole(shopId);
        return notificationService.markAsRead(id, shopId, role);
    }

    @PatchMapping("/notifications/read-all")
    public MarkAllReadResponse markAllNotificationsRead(Principal principal) {
        String shopId = principal != null ? principal.getName() : "admin";
        String role = resolveRole(shopId);
        long count = notificationService.markAllAsRead(shopId, role);
        return new MarkAllReadResponse(count);
    }

    @PostMapping("/notifications")
    public NotificationResponse createNotification(Principal principal,
            @Valid @RequestBody CreateNotificationRequest request) {
        String shopId = principal != null ? principal.getName() : "admin";
        String role = resolveRole(shopId);
        return notificationService.createForContext(shopId, role, request);
    }

    // ========== HELPERS ==========

    private String resolveRole(String shopId) {
        return "admin".equalsIgnoreCase(shopId) ? "admin" : "shop";
    }

    private OverviewResponse buildOverview(String shopId) {
        double todayRevenue = invoiceRepository.findByShopIdAndIssueDate(shopId, LocalDate.now())
                .stream()
                .filter(invoice -> "Paid".equalsIgnoreCase(invoice.getStatus()))
                .mapToDouble(invoice -> invoice.getAmount().doubleValue())
                .sum();
        int pendingInvoices = (int) invoiceRepository.countByShopIdAndStatus(shopId, "Pending");
        return new OverviewResponse(LocalDate.now().toString(), todayRevenue, 12.4, pendingInvoices);
    }

    private List<InvoiceResponse> buildRecentInvoices(String shopId) {
        return invoiceRepository.findTop10ByShopIdOrderByIssueDateDesc(shopId).stream()
                .map(this::toInvoiceResponse)
                .toList();
    }

    private InvoiceResponse toInvoiceResponse(InvoiceEntity entity) {
        return new InvoiceResponse(
                entity.getInvoiceId(),
                entity.getCustomer(),
                entity.getMobilenumber(),
                entity.getAddress(),
                entity.getItems(),
                entity.getType() == null ? "OTHER" : entity.getType(),
                entity.getAmount().doubleValue(),
                entity.getStatus(),
                entity.getGrossAmount().doubleValue(),
                entity.getNetAmount().doubleValue(),
                entity.getDiscount().doubleValue(),
                entity.getMakingCharge() != null ? entity.getMakingCharge().doubleValue() : 0.0,
                entity.getGstRate() != null ? entity.getGstRate().doubleValue() : 0.0,
                entity.getPaymentMethod() != null ? entity.getPaymentMethod() : "CASH",
                entity.getIssueDate() != null ? entity.getIssueDate().atStartOfDay() : LocalDate.now().atStartOfDay());
    }
}
