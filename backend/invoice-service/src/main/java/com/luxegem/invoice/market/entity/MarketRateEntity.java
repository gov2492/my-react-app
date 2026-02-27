package com.luxegem.invoice.market.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "market_rates")
public class MarketRateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String metal;
    private double pricePerGram;
    private String unit;
    private String currency;
    private double changePercent;

    public MarketRateEntity() {
    }

    public MarketRateEntity(String metal, double pricePerGram, String unit, String currency, double changePercent) {
        this.metal = metal;
        this.pricePerGram = pricePerGram;
        this.unit = unit;
        this.currency = currency;
        this.changePercent = changePercent;
    }

    public Long getId() {
        return id;
    }

    public String getMetal() {
        return metal;
    }

    public double getPricePerGram() {
        return pricePerGram;
    }

    public String getUnit() {
        return unit;
    }

    public String getCurrency() {
        return currency;
    }

    public double getChangePercent() {
        return changePercent;
    }
}
