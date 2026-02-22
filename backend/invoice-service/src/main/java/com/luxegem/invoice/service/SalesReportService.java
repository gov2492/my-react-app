package com.luxegem.invoice.service;

import com.luxegem.invoice.entity.InvoiceEntity;
import com.luxegem.invoice.model.InvoiceItemDto;
import com.luxegem.invoice.model.MetalSalesResponse;
import com.luxegem.invoice.model.PaymentDistributionResponse;
import com.luxegem.invoice.model.SalesReportResponse;
import com.luxegem.invoice.model.SalesReportRowResponse;
import com.luxegem.invoice.model.SalesSummaryResponse;
import com.luxegem.invoice.model.SalesTrendPointResponse;
import com.luxegem.invoice.repository.InvoiceRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class SalesReportService {

    private static final String DEFAULT_SALESPERSON = "Admin / Staff";

    private final InvoiceRepository invoiceRepository;

    public SalesReportService(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    @Transactional(readOnly = true)
    public SalesReportResponse getSalesReport(
            String shopId,
            String dateFilter,
            String from,
            String to,
            String search,
            String paymentMethod,
            String metalType,
            String salesperson,
            Double minAmount,
            Double maxAmount,
            int page,
            int size,
            String sortBy,
            String sortDir) {

        if (!matchesSalespersonFilter(salesperson)) {
            return emptyResponse(page, size);
        }

        DateRange range = resolveDateRange(dateFilter, from, to);
        Specification<InvoiceEntity> spec = buildSpecification(
                shopId,
                range,
                search,
                paymentMethod,
                metalType,
                minAmount,
                maxAmount);

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(1, Math.min(size, 100)),
                Sort.by(resolveSortDirection(sortDir), resolveSortBy(sortBy)));

        Page<InvoiceEntity> pagedInvoices = invoiceRepository.findAll(spec, pageable);
        List<InvoiceEntity> allFilteredInvoices = invoiceRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "issueDate"));

        SalesSummaryResponse summary = buildSummary(allFilteredInvoices);
        List<SalesTrendPointResponse> trend = buildSalesTrend(allFilteredInvoices);
        List<PaymentDistributionResponse> paymentDistribution = buildPaymentDistribution(allFilteredInvoices);
        List<MetalSalesResponse> metalComparison = buildMetalComparison(allFilteredInvoices);

        List<SalesReportRowResponse> rows = pagedInvoices.getContent().stream()
                .map(this::toRow)
                .toList();

        return new SalesReportResponse(
                summary,
                trend,
                paymentDistribution,
                metalComparison,
                rows,
                pagedInvoices.getNumber(),
                pagedInvoices.getSize(),
                pagedInvoices.getTotalElements(),
                pagedInvoices.getTotalPages());
    }

    private Specification<InvoiceEntity> buildSpecification(
            String shopId,
            DateRange range,
            String search,
            String paymentMethod,
            String metalType,
            Double minAmount,
            Double maxAmount) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            String normalizedShopId = shopId == null ? "" : shopId.trim().toLowerCase(Locale.ROOT);

            predicates.add(cb.equal(cb.lower(root.get("shopId")), normalizedShopId));
            predicates.add(cb.between(root.get("issueDate"), range.from(), range.to()));

            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("invoiceId")), term),
                        cb.like(cb.lower(root.get("customer")), term)));
            }

            if (paymentMethod != null && !paymentMethod.isBlank() && !"ALL".equalsIgnoreCase(paymentMethod)) {
                predicates.add(cb.equal(cb.lower(root.get("paymentMethod")), paymentMethod.trim().toLowerCase(Locale.ROOT)));
            }

            if (metalType != null && !metalType.isBlank() && !"ALL".equalsIgnoreCase(metalType)) {
                String normalizedMetal = metalType.trim().toUpperCase(Locale.ROOT);
                if ("GOLD".equals(normalizedMetal)) {
                    predicates.add(cb.like(cb.upper(root.get("type")), "GOLD%"));
                } else if ("SILVER".equals(normalizedMetal)) {
                    predicates.add(cb.like(cb.upper(root.get("type")), "SILVER%"));
                } else if ("PLATINUM".equals(normalizedMetal)) {
                    predicates.add(cb.like(cb.upper(root.get("type")), "PLATINUM%"));
                } else if ("DIAMOND".equals(normalizedMetal)) {
                    predicates.add(cb.like(cb.upper(root.get("type")), "DIAMOND%"));
                } else {
                    predicates.add(cb.like(cb.upper(root.get("type")), normalizedMetal + "%"));
                }
            }

            if (minAmount != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("netAmount"), BigDecimal.valueOf(minAmount)));
            }
            if (maxAmount != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("netAmount"), BigDecimal.valueOf(maxAmount)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private SalesSummaryResponse buildSummary(List<InvoiceEntity> invoices) {
        double totalSales = invoices.stream()
                .map(InvoiceEntity::getNetAmount)
                .filter(Objects::nonNull)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();

        double totalGst = invoices.stream()
                .mapToDouble(this::calculateGstAmount)
                .sum();

        double goldGrams = invoices.stream()
                .flatMap(invoice -> safeItems(invoice).stream())
                .filter(item -> normalizedType(item.type()).startsWith("GOLD"))
                .mapToDouble(item -> safeDouble(item.weight()))
                .sum();

        double silverGrams = invoices.stream()
                .flatMap(invoice -> safeItems(invoice).stream())
                .filter(item -> normalizedType(item.type()).startsWith("SILVER"))
                .mapToDouble(item -> safeDouble(item.weight()))
                .sum();

        return new SalesSummaryResponse(totalSales, invoices.size(), totalGst, goldGrams, silverGrams);
    }

    private List<SalesTrendPointResponse> buildSalesTrend(List<InvoiceEntity> invoices) {
        Map<LocalDate, List<InvoiceEntity>> byDate = invoices.stream()
                .collect(java.util.stream.Collectors.groupingBy(InvoiceEntity::getIssueDate, LinkedHashMap::new,
                        java.util.stream.Collectors.toList()));

        return byDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new SalesTrendPointResponse(
                        entry.getKey().toString(),
                        entry.getValue().stream()
                                .map(InvoiceEntity::getNetAmount)
                                .filter(Objects::nonNull)
                                .mapToDouble(BigDecimal::doubleValue)
                                .sum(),
                        entry.getValue().size()))
                .toList();
    }

    private List<PaymentDistributionResponse> buildPaymentDistribution(List<InvoiceEntity> invoices) {
        Map<String, List<InvoiceEntity>> byPayment = invoices.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        invoice -> normalizePaymentMethod(invoice.getPaymentMethod()),
                        LinkedHashMap::new,
                        java.util.stream.Collectors.toList()));

        return byPayment.entrySet().stream()
                .map(entry -> new PaymentDistributionResponse(
                        entry.getKey(),
                        entry.getValue().stream()
                                .map(InvoiceEntity::getNetAmount)
                                .filter(Objects::nonNull)
                                .mapToDouble(BigDecimal::doubleValue)
                                .sum(),
                        entry.getValue().size()))
                .sorted(Comparator.comparingDouble(PaymentDistributionResponse::amount).reversed())
                .toList();
    }

    private List<MetalSalesResponse> buildMetalComparison(List<InvoiceEntity> invoices) {
        record MetalAccumulator(double amount, double weight) {
            MetalAccumulator add(double amountToAdd, double weightToAdd) {
                return new MetalAccumulator(this.amount + amountToAdd, this.weight + weightToAdd);
            }
        }

        Map<String, MetalAccumulator> aggregate = new LinkedHashMap<>();
        for (InvoiceEntity invoice : invoices) {
            double invoiceAmount = safeAmount(invoice.getNetAmount());
            List<InvoiceItemDto> items = safeItems(invoice);
            if (items.isEmpty()) {
                String metal = normalizeMetal(invoice.getType());
                aggregate.put(metal, aggregate.getOrDefault(metal, new MetalAccumulator(0, 0)).add(invoiceAmount, 0));
                continue;
            }

            double totalWeight = items.stream().mapToDouble(item -> safeDouble(item.weight())).sum();
            for (InvoiceItemDto item : items) {
                String metal = normalizeMetal(item.type());
                double itemWeight = safeDouble(item.weight());
                double itemShare = totalWeight > 0 ? (itemWeight / totalWeight) * invoiceAmount : 0;
                aggregate.put(metal, aggregate.getOrDefault(metal, new MetalAccumulator(0, 0)).add(itemShare, itemWeight));
            }
        }

        return aggregate.entrySet().stream()
                .map(entry -> new MetalSalesResponse(entry.getKey(), entry.getValue().amount, entry.getValue().weight))
                .sorted(Comparator.comparingDouble(MetalSalesResponse::amount).reversed())
                .toList();
    }

    private SalesReportRowResponse toRow(InvoiceEntity invoice) {
        double totalWeight = safeItems(invoice).stream()
                .mapToDouble(item -> safeDouble(item.weight()))
                .sum();

        return new SalesReportRowResponse(
                invoice.getInvoiceId(),
                invoice.getIssueDate().toString(),
                invoice.getCustomer(),
                normalizePaymentMethod(invoice.getPaymentMethod()),
                normalizeMetal(invoice.getType()),
                totalWeight,
                calculateGstAmount(invoice),
                safeAmount(invoice.getNetAmount()),
                DEFAULT_SALESPERSON);
    }

    private Sort.Direction resolveSortDirection(String sortDir) {
        if (sortDir != null && sortDir.equalsIgnoreCase("asc")) {
            return Sort.Direction.ASC;
        }
        return Sort.Direction.DESC;
    }

    private String resolveSortBy(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return "issueDate";
        }

        return switch (sortBy) {
            case "invoiceNumber" -> "invoiceId";
            case "date" -> "issueDate";
            case "customerName" -> "customer";
            case "paymentMethod" -> "paymentMethod";
            case "metalType" -> "type";
            case "netAmount" -> "netAmount";
            default -> "issueDate";
        };
    }

    private DateRange resolveDateRange(String dateFilter, String from, String to) {
        LocalDate today = LocalDate.now();
        String normalized = dateFilter == null ? "THIS_YEAR" : dateFilter.trim().toUpperCase(Locale.ROOT);

        return switch (normalized) {
            case "TODAY" -> new DateRange(today, today);
            case "THIS_WEEK" -> new DateRange(today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)), today);
            case "THIS_MONTH" -> new DateRange(today.withDayOfMonth(1), today);
            case "LAST_6_MONTHS" -> {
                YearMonth startMonth = YearMonth.from(today).minusMonths(5);
                yield new DateRange(startMonth.atDay(1), today);
            }
            case "THIS_YEAR" -> new DateRange(today.withDayOfYear(1), today);
            case "CUSTOM" -> {
                LocalDate fromDate = parseDate(from, today.withDayOfMonth(1));
                LocalDate toDate = parseDate(to, today);
                if (toDate.isBefore(fromDate)) {
                    yield new DateRange(toDate, fromDate);
                }
                yield new DateRange(fromDate, toDate);
            }
            default -> new DateRange(today.withDayOfYear(1), today);
        };
    }

    private LocalDate parseDate(String input, LocalDate fallback) {
        if (input == null || input.isBlank()) {
            return fallback;
        }
        try {
            return LocalDate.parse(input);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private boolean matchesSalespersonFilter(String salesperson) {
        if (salesperson == null || salesperson.isBlank()) {
            return true;
        }
        String normalized = salesperson.trim().toLowerCase(Locale.ROOT);
        return "admin".contains(normalized)
                || "staff".contains(normalized)
                || "admin / staff".contains(normalized);
    }

    private String normalizePaymentMethod(String value) {
        if (value == null || value.isBlank()) {
            return "Cash";
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "upi" -> "UPI";
            case "credit card" -> "Card";
            case "debit card" -> "Card";
            case "card" -> "Card";
            default -> Character.toUpperCase(normalized.charAt(0)) + normalized.substring(1);
        };
    }

    private String normalizeMetal(String value) {
        String normalized = normalizedType(value);
        if (normalized.startsWith("GOLD")) {
            if (normalized.contains("18K")) {
                return "Gold 18K";
            }
            if (normalized.contains("22K")) {
                return "Gold 22K";
            }
            if (normalized.contains("24K")) {
                return "Gold 24K";
            }
            return "Gold";
        }
        if (normalized.startsWith("SILVER")) {
            return "Silver";
        }
        if (normalized.startsWith("PLATINUM")) {
            return "Platinum";
        }
        if (normalized.startsWith("DIAMOND")) {
            return "Diamond";
        }
        if (normalized.isBlank()) {
            return "Other";
        }
        return Character.toUpperCase(normalized.charAt(0)) + normalized.substring(1).toLowerCase(Locale.ROOT);
    }

    private String normalizedType(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private List<InvoiceItemDto> safeItems(InvoiceEntity invoice) {
        if (invoice.getItems() == null) {
            return List.of();
        }
        return invoice.getItems();
    }

    private double safeAmount(BigDecimal value) {
        return value == null ? 0.0 : value.doubleValue();
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }

    private double calculateGstAmount(InvoiceEntity invoice) {
        double net = safeAmount(invoice.getNetAmount());
        double gross = safeAmount(invoice.getGrossAmount());
        double discount = safeAmount(invoice.getDiscount());
        double gst = net - gross + discount;
        return Math.max(gst, 0.0);
    }

    private SalesReportResponse emptyResponse(int page, int size) {
        return new SalesReportResponse(
                new SalesSummaryResponse(0.0, 0, 0.0, 0.0, 0.0),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                Math.max(page, 0),
                Math.max(1, size),
                0,
                0);
    }

    private record DateRange(LocalDate from, LocalDate to) {
    }
}
