package com.luxegem.invoice.service;

import com.luxegem.invoice.entity.InvoiceEntity;
import com.luxegem.invoice.entity.InventoryEntity;
import com.luxegem.invoice.model.CreateDetailedInvoiceRequest;
import com.luxegem.invoice.model.InvoiceDetailedResponse;
import com.luxegem.invoice.model.InvoiceItemDetail;
import com.luxegem.invoice.model.InvoiceItemDto;
import com.luxegem.invoice.model.InventoryItemResponse;
import com.luxegem.invoice.repository.InventoryRepository;
import com.luxegem.invoice.repository.InvoiceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@Transactional
public class BillingService {

    private static final Logger logger = LoggerFactory.getLogger(BillingService.class);

    private final InvoiceRepository invoiceRepository;
    private final InventoryRepository inventoryRepository;

    public BillingService(InvoiceRepository invoiceRepository, InventoryRepository inventoryRepository) {
        this.invoiceRepository = invoiceRepository;
        this.inventoryRepository = inventoryRepository;
    }

    /**
     * Create invoice with detailed items from inventory
     */
    public InvoiceDetailedResponse createDetailedInvoice(CreateDetailedInvoiceRequest request) {
        logger.info("Creating detailed invoice for customer: {}", request.customer());

        // Validate and fetch items from inventory
        List<InvoiceItemDetail> itemDetails = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (String sku : request.itemSKUs()) {
            Optional<InventoryEntity> inventoryItem = inventoryRepository.findBySku(sku);
            if (inventoryItem.isPresent()) {
                InventoryEntity item = inventoryItem.get();
                InvoiceItemDetail detail = new InvoiceItemDetail(
                        item.getSku(),
                        item.getItemName(),
                        item.getType(),
                        item.getWeightGrams().doubleValue(),
                        request.quantities().getOrDefault(sku, 1),
                        item.getUnitPrice().doubleValue(),
                        item.getUnitPrice().multiply(BigDecimal.valueOf(request.quantities().getOrDefault(sku, 1)))
                                .doubleValue());
                itemDetails.add(detail);
                totalAmount = totalAmount.add(BigDecimal.valueOf(detail.lineTotal()));
            } else {
                logger.warn("SKU not found in inventory: {}", sku);
            }
        }

        // Generate invoice ID
        String generatedInvoiceId = generateInvoiceId();

        // Convert items to JSON for storage
        List<InvoiceItemDto> itemDtos = convertToDtos(itemDetails);

        // Create and save invoice entity
        InvoiceEntity invoiceEntity = new InvoiceEntity(
                generatedInvoiceId,
                request.customer(),
                itemDtos,
                request.type(),
                totalAmount,
                "Pending",
                LocalDate.now());

        InvoiceEntity savedInvoice = invoiceRepository.save(invoiceEntity);
        logger.info("Invoice created successfully: {}", generatedInvoiceId);

        // Return detailed response
        return new InvoiceDetailedResponse(
                savedInvoice.getInvoiceId(),
                savedInvoice.getCustomer(),
                itemDetails,
                savedInvoice.getType(),
                totalAmount.doubleValue(),
                "Pending",
                LocalDate.now().toString(),
                calculateTaxAndTotal(totalAmount.doubleValue()));
    }

    /**
     * Get invoice with detailed item breakdown
     */
    public InvoiceDetailedResponse getInvoiceDetails(String invoiceId) {
        logger.info("Fetching invoice details: {}", invoiceId);

        InvoiceEntity invoice = invoiceRepository.findByInvoiceId(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + invoiceId));

        // Parse items from JSON
        List<InvoiceItemDetail> itemDetails = convertToDetails(invoice.getItems());
        BigDecimal totalAmount = invoice.getAmount();

        return new InvoiceDetailedResponse(
                invoice.getInvoiceId(),
                invoice.getCustomer(),
                itemDetails,
                invoice.getType(),
                totalAmount.doubleValue(),
                invoice.getStatus(),
                invoice.getIssueDate().toString(),
                calculateTaxAndTotal(totalAmount.doubleValue()));
    }

    /**
     * Get all available inventory items
     */
    public List<InventoryItemResponse> getAvailableItems() {
        logger.info("Fetching all available inventory items");
        return inventoryRepository.findAll().stream()
                .map(item -> new InventoryItemResponse(
                        item.getSku(),
                        item.getItemName(),
                        item.getType(),
                        item.getWeightGrams().doubleValue(),
                        item.getQuantity(),
                        item.getUnitPrice().doubleValue(),
                        item.getLowStockThreshold()))
                .toList();
    }

    /**
     * Search inventory items by type
     */
    public List<InventoryItemResponse> searchItemsByType(String type) {
        logger.info("Searching inventory items by type: {}", type);
        return inventoryRepository.findByType(type).stream()
                .map(item -> new InventoryItemResponse(
                        item.getSku(),
                        item.getItemName(),
                        item.getType(),
                        item.getWeightGrams().doubleValue(),
                        item.getQuantity(),
                        item.getUnitPrice().doubleValue(),
                        item.getLowStockThreshold()))
                .toList();
    }

    /**
     * Get low stock alerts
     */
    public List<InventoryItemResponse> getLowStockItems() {
        logger.info("Fetching low stock inventory items");
        return inventoryRepository.findAll().stream()
                .filter(item -> item.getQuantity() <= item.getLowStockThreshold())
                .map(item -> new InventoryItemResponse(
                        item.getSku(),
                        item.getItemName(),
                        item.getType(),
                        item.getWeightGrams().doubleValue(),
                        item.getQuantity(),
                        item.getUnitPrice().doubleValue(),
                        item.getLowStockThreshold()))
                .toList();
    }

    // ========== PRIVATE HELPER METHODS ==========

    private String generateInvoiceId() {
        long lastId = invoiceRepository.findTopByOrderByIdDesc()
                .map(InvoiceEntity::getId)
                .orElse(2040L);
        return "#INV-" + (lastId + 1);
    }

    private List<InvoiceItemDto> convertToDtos(List<InvoiceItemDetail> items) {
        if (items == null)
            return new ArrayList<>();
        return items.stream()
                .map(item -> new InvoiceItemDto(item.itemName(), item.type(), item.weightGrams(), item.unitPrice(), 0.0,
                        0.0))
                .toList();
    }

    private List<InvoiceItemDetail> convertToDetails(List<InvoiceItemDto> items) {
        if (items == null)
            return new ArrayList<>();
        return items.stream()
                .map(item -> new InvoiceItemDetail("N/A", item.description(), item.type(),
                        item.weight() == null ? 0.0 : item.weight(), 1, item.rate() == null ? 0.0 : item.rate(),
                        (item.weight() == null ? 0.0 : item.weight()) * (item.rate() == null ? 0.0 : item.rate())))
                .toList();
    }

    private Map<String, Object> calculateTaxAndTotal(double subtotal) {
        double taxRate = 0.18; // 18% GST for India
        double taxAmount = subtotal * taxRate;
        double total = subtotal + taxAmount;

        return Map.of(
                "subtotal", subtotal,
                "taxRate", taxRate * 100,
                "taxAmount", taxAmount,
                "total", total);
    }
}
