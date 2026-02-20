package com.luxegem.invoice.controller;

import com.luxegem.invoice.entity.InvoiceEntity;
import com.luxegem.invoice.model.CreateInvoiceRequest;
import com.luxegem.invoice.model.InvoiceResponse;
import com.luxegem.invoice.model.OverviewResponse;
import com.luxegem.invoice.repository.InvoiceRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;

    public InvoiceController(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    @GetMapping("/overview")
    public OverviewResponse overview() {
        double todayRevenue = invoiceRepository.findByIssueDate(LocalDate.now()).stream()
                .filter(invoice -> "Paid".equalsIgnoreCase(invoice.getStatus()))
                .mapToDouble(invoice -> invoice.getAmount().doubleValue())
                .sum();

        int pendingInvoices = (int) invoiceRepository.countByStatus("Pending");

        return new OverviewResponse(LocalDate.now().toString(), todayRevenue, 12.4, pendingInvoices);
    }

    @GetMapping("/recent")
    public List<InvoiceResponse> recentInvoices() {
        return invoiceRepository.findTop10ByOrderByIssueDateDesc().stream()
                .map(invoice -> new InvoiceResponse(
                        invoice.getInvoiceId(),
                        invoice.getCustomer(),
                        invoice.getItems(),
                        invoice.getType() == null ? "OTHER" : invoice.getType(),
                        invoice.getAmount().doubleValue(),
                        invoice.getStatus()))
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InvoiceResponse createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        long lastId = invoiceRepository.findTopByOrderByIdDesc()
                .map(InvoiceEntity::getId)
                .orElse(2040L);

        String generatedInvoiceId = "#INV-" + (lastId + 1);

        InvoiceEntity saved = invoiceRepository.save(new InvoiceEntity(
                generatedInvoiceId,
                request.customer(),
                request.items(),
                request.type(),
                BigDecimal.valueOf(request.amount()),
                request.status(),
                LocalDate.now()
        ));

        return new InvoiceResponse(
                saved.getInvoiceId(),
                saved.getCustomer(),
                saved.getItems(),
                saved.getType() == null ? "OTHER" : saved.getType(),
                saved.getAmount().doubleValue(),
                saved.getStatus()
        );
    }
}
