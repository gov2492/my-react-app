package com.luxegem.invoice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "invoices")
public class InvoiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String invoiceId;

    @Column(nullable = false)
    private String customer;

    @Column(nullable = false)
    private String items;

    @Column
    private String type;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private LocalDate issueDate;

    public InvoiceEntity() {
    }

    public InvoiceEntity(String invoiceId, String customer, String items, String type, BigDecimal amount, String status, LocalDate issueDate) {
        this.invoiceId = invoiceId;
        this.customer = customer;
        this.items = items;
        this.type = type;
        this.amount = amount;
        this.status = status;
        this.issueDate = issueDate;
    }

    public Long getId() {
        return id;
    }

    public String getInvoiceId() {
        return invoiceId;
    }

    public String getCustomer() {
        return customer;
    }

    public String getItems() {
        return items;
    }

    public String getType() {
        return type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getStatus() {
        return status;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }
}
