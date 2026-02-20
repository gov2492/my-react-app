package com.luxegem.invoice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory")
public class InventoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sku;

    @Column(nullable = false)
    private String itemName;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal weightGrams;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private Integer lowStockThreshold;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public InventoryEntity() {
    }

    public InventoryEntity(
            String sku,
            String itemName,
            String type,
            BigDecimal weightGrams,
            Integer quantity,
            BigDecimal unitPrice,
            Integer lowStockThreshold
    ) {
        this.sku = sku;
        this.itemName = itemName;
        this.type = type;
        this.weightGrams = weightGrams;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.lowStockThreshold = lowStockThreshold;
    }

    @PrePersist
    @PreUpdate
    public void touchUpdatedAt() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getSku() {
        return sku;
    }

    public String getItemName() {
        return itemName;
    }

    public String getType() {
        return type;
    }

    public BigDecimal getWeightGrams() {
        return weightGrams;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public Integer getLowStockThreshold() {
        return lowStockThreshold;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
