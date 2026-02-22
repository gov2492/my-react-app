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
    private String itemCode;

    @Column(nullable = false)
    private String itemName;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String metalType;

    @Column
    private String purity;

    @Column(precision = 10, scale = 3)
    private BigDecimal grossWeight;

    @Column(precision = 10, scale = 3)
    private BigDecimal netWeight;

    @Column(precision = 10, scale = 2)
    private BigDecimal makingCharge;

    @Column(precision = 12, scale = 2)
    private BigDecimal ratePerGram;

    @Column
    private Integer stockQuantity;

    @Column
    private String hsnCode;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private String shopId;

    public InventoryEntity() {
    }

    public InventoryEntity(
            String itemCode,
            String itemName,
            String category,
            String metalType,
            String purity,
            String description) {
        this.itemCode = itemCode;
        this.itemName = itemName;
        this.category = category;
        this.metalType = metalType;
        this.purity = purity;
        this.description = description;
    }

    public InventoryEntity(
            String itemCode,
            String itemName,
            String category,
            String metalType,
            String purity,
            BigDecimal grossWeight,
            BigDecimal netWeight,
            BigDecimal makingCharge,
            BigDecimal ratePerGram,
            Integer stockQuantity,
            String hsnCode,
            String description) {
        this.itemCode = itemCode;
        this.itemName = itemName;
        this.category = category;
        this.metalType = metalType;
        this.purity = purity;
        this.grossWeight = grossWeight;
        this.netWeight = netWeight;
        this.makingCharge = makingCharge;
        this.ratePerGram = ratePerGram;
        this.stockQuantity = stockQuantity;
        this.hsnCode = hsnCode;
        this.description = description;
    }

    @PrePersist
    public void onPrePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void touchUpdatedAt() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getItemCode() {
        return itemCode;
    }

    public String getItemName() {
        return itemName;
    }

    public String getCategory() {
        return category;
    }

    public String getMetalType() {
        return metalType;
    }

    public String getPurity() {
        return purity;
    }

    public BigDecimal getGrossWeight() {
        return grossWeight;
    }

    public BigDecimal getNetWeight() {
        return netWeight;
    }

    public BigDecimal getMakingCharge() {
        return makingCharge;
    }

    public BigDecimal getRatePerGram() {
        return ratePerGram;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public String getHsnCode() {
        return hsnCode;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getShopId() {
        return shopId;
    }

    public void setShopId(String shopId) {
        this.shopId = shopId;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }
}
