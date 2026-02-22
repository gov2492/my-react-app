package com.luxegem.invoice.controller;

import com.luxegem.invoice.model.SalesReportResponse;
import com.luxegem.invoice.service.SalesReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/reports")
public class SalesReportController {

    private final SalesReportService salesReportService;

    public SalesReportController(SalesReportService salesReportService) {
        this.salesReportService = salesReportService;
    }

    @GetMapping("/sales")
    public SalesReportResponse getSalesReport(
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
            @RequestParam(defaultValue = "desc") String sortDir,
            Principal principal) {

        String shopId = principal != null ? principal.getName() : "admin";

        return salesReportService.getSalesReport(
                shopId,
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
}
