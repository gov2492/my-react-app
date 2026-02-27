package com.luxegem.invoice.controller;

import com.luxegem.invoice.entity.InventoryEntity;
import com.luxegem.invoice.model.CreateInventoryRequest;
import com.luxegem.invoice.model.InventoryResponse;
import com.luxegem.invoice.model.NotificationType;
import com.luxegem.invoice.repository.InventoryRepository;
import com.luxegem.invoice.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.math.BigDecimal;
import java.util.List;
import java.security.Principal;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryRepository inventoryRepository;
    private final NotificationService notificationService;

    public InventoryController(InventoryRepository inventoryRepository, NotificationService notificationService) {
        this.inventoryRepository = inventoryRepository;
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<InventoryResponse> listInventory(@RequestParam(required = false) String q, Principal principal) {
        String shopId = principal != null ? principal.getName() : "admin";
        List<InventoryEntity> items = (q == null || q.isBlank())
                ? inventoryRepository.findAllByShopIdOrderByUpdatedAtDesc(shopId)
                : inventoryRepository.searchByShopId(shopId, q.trim());

        return items.stream().map(this::toResponse).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryResponse createInventory(@Valid @RequestBody CreateInventoryRequest request, Principal principal) {
        String shopId = principal != null ? principal.getName() : "admin";
        String itemCode = (request.itemCode() == null || request.itemCode().isBlank())
                ? generateSku()
                : request.itemCode().trim().toUpperCase();

        InventoryEntity entity = new InventoryEntity(
                itemCode,
                request.itemName(),
                request.category(),
                request.metalType(),
                request.purity(),
                request.grossWeight() != null ? BigDecimal.valueOf(request.grossWeight()) : BigDecimal.ZERO,
                request.netWeight() != null ? BigDecimal.valueOf(request.netWeight()) : null,
                request.makingCharge() != null ? BigDecimal.valueOf(request.makingCharge()) : null,
                request.ratePerGram() != null ? BigDecimal.valueOf(request.ratePerGram()) : BigDecimal.ZERO,
                request.stockQuantity() != null ? request.stockQuantity() : 0,
                request.hsnCode(),
                request.description());
        entity.setShopId(shopId);
        InventoryEntity saved = inventoryRepository.save(entity);
        notificationService.createSystemNotification(
                shopId,
                "Inventory item added",
                String.format("%s (%s) added to inventory", saved.getItemName(), saved.getItemCode()),
                NotificationType.INFO);

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
                entity.getItemCode(),
                entity.getItemName(),
                entity.getCategory(),
                entity.getMetalType(),
                entity.getPurity(),
                entity.getDescription(),
                entity.getUpdatedAt().toString(),
                entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : entity.getUpdatedAt().toString());
    }
}
