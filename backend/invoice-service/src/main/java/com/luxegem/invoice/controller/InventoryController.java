package com.luxegem.invoice.controller;

import com.luxegem.invoice.entity.InventoryEntity;
import com.luxegem.invoice.model.CreateInventoryRequest;
import com.luxegem.invoice.model.InventoryResponse;
import com.luxegem.invoice.repository.InventoryRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryRepository inventoryRepository;

    public InventoryController(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @GetMapping
    public List<InventoryResponse> listInventory(@RequestParam(required = false) String q) {
        List<InventoryEntity> items = (q == null || q.isBlank())
                ? inventoryRepository.findAllByOrderByUpdatedAtDesc()
                : inventoryRepository.search(q.trim());

        return items.stream().map(this::toResponse).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryResponse createInventory(@Valid @RequestBody CreateInventoryRequest request) {
        String sku = (request.sku() == null || request.sku().isBlank())
                ? generateSku()
                : request.sku().trim().toUpperCase();

        InventoryEntity saved = inventoryRepository.save(new InventoryEntity(
                sku,
                request.itemName(),
                request.type(),
                BigDecimal.valueOf(request.weightGrams()),
                request.quantity(),
                BigDecimal.valueOf(request.unitPrice()),
                request.lowStockThreshold()
        ));

        return toResponse(saved);
    }

    private String generateSku() {
        long nextId = inventoryRepository.findTopByOrderByIdDesc()
                .map(InventoryEntity::getId)
                .orElse(0L) + 1;
        return "AJ-INV-" + String.format("%04d", nextId);
    }

    private InventoryResponse toResponse(InventoryEntity entity) {
        return new InventoryResponse(
                entity.getSku(),
                entity.getItemName(),
                entity.getType(),
                entity.getWeightGrams().doubleValue(),
                entity.getQuantity(),
                entity.getUnitPrice().doubleValue(),
                entity.getLowStockThreshold(),
                entity.getUpdatedAt().toString()
        );
    }
}
