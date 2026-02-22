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
import java.security.Principal;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

        private final InvoiceRepository invoiceRepository;

        public InvoiceController(InvoiceRepository invoiceRepository) {
                this.invoiceRepository = invoiceRepository;
        }

        @GetMapping("/overview")
        public OverviewResponse overview(Principal principal) {
                String shopId = principal != null ? principal.getName() : "admin";
                double todayRevenue = invoiceRepository.findByShopIdAndIssueDate(shopId, LocalDate.now())
                                .stream()
                                .filter(invoice -> "Paid".equalsIgnoreCase(invoice.getStatus()))
                                .mapToDouble(invoice -> invoice.getAmount().doubleValue())
                                .sum();

                int pendingInvoices = (int) invoiceRepository.countByShopIdAndStatus(shopId, "Pending");

                return new OverviewResponse(LocalDate.now().toString(), todayRevenue, 12.4, pendingInvoices);
        }

        @GetMapping("/recent")
        public List<InvoiceResponse> recentInvoices(Principal principal) {
                String shopId = principal != null ? principal.getName() : "admin";
                return invoiceRepository.findTop10ByShopIdOrderByIssueDateDesc(shopId).stream()
                                .map(invoice -> new InvoiceResponse(
                                                invoice.getInvoiceId(),
                                                invoice.getCustomer(),
                                                invoice.getMobilenumber(),
                                                invoice.getAddress(),
                                                invoice.getItems(),
                                                invoice.getType() == null ? "OTHER" : invoice.getType(),
                                                invoice.getAmount().doubleValue(),
                                                invoice.getStatus(),
                                                invoice.getGrossAmount().doubleValue(),
                                                invoice.getNetAmount().doubleValue(),
                                                invoice.getDiscount().doubleValue(),
                                                invoice.getMakingCharge() != null
                                                                ? invoice.getMakingCharge().doubleValue()
                                                                : 0.0,
                                                invoice.getGstRate() != null ? invoice.getGstRate().doubleValue()
                                                                : 0.0,
                                                invoice.getPaymentMethod() != null ? invoice.getPaymentMethod()
                                                                : "CASH"))
                                .toList();
        }

        @PostMapping
        @ResponseStatus(HttpStatus.CREATED)
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
                return new InvoiceResponse(
                                entity.getInvoiceId(),
                                entity.getCustomer(),
                                entity.getMobilenumber(),
                                entity.getAddress(),
                                entity.getItems(),
                                entity.getType(),
                                entity.getAmount().doubleValue(),
                                entity.getStatus(),
                                entity.getGrossAmount().doubleValue(),
                                entity.getNetAmount().doubleValue(),
                                entity.getDiscount().doubleValue(),
                                entity.getMakingCharge() != null ? entity.getMakingCharge().doubleValue() : 0.0,
                                entity.getGstRate() != null ? entity.getGstRate().doubleValue() : 0.0,
                                entity.getPaymentMethod() != null ? entity.getPaymentMethod() : "CASH");
        }
}
