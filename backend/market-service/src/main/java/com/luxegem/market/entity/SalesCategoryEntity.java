package com.luxegem.market.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sales_categories")
public class SalesCategoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int percent;
    private double totalSales;

    public SalesCategoryEntity() {
    }

    public SalesCategoryEntity(String name, int percent, double totalSales) {
        this.name = name;
        this.percent = percent;
        this.totalSales = totalSales;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getPercent() {
        return percent;
    }

    public double getTotalSales() {
        return totalSales;
    }
}
