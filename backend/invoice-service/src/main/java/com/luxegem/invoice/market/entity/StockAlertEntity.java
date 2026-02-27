package com.luxegem.invoice.market.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "stock_alerts")
public class StockAlertEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String item;
    private String note;
    private String level;

    public StockAlertEntity() {
    }

    public StockAlertEntity(String item, String note, String level) {
        this.item = item;
        this.note = note;
        this.level = level;
    }

    public Long getId() {
        return id;
    }

    public String getItem() {
        return item;
    }

    public String getNote() {
        return note;
    }

    public String getLevel() {
        return level;
    }
}
