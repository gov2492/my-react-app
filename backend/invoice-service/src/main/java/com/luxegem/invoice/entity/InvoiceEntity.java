package com.luxegem.invoice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import com.luxegem.invoice.model.InvoiceItemDto;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

    @Column
    private String mobilenumber;

    @Column
    private String address;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<InvoiceItemDto> items;

    @Column
    private String type;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private LocalDate issueDate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal grossAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal netAmount;

    @Column
    private String shopId;

    @Column
    private String paymentMethod;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal discount;

    @Column(precision = 12, scale = 2)
    private BigDecimal makingCharge;

    @Column(precision = 5, scale = 2)
    private BigDecimal gstRate;

    public InvoiceEntity() {
    }

    public InvoiceEntity(String invoiceId, String customer, List<InvoiceItemDto> items, String type, BigDecimal amount,
            String status,
            LocalDate issueDate) {
        this.invoiceId = invoiceId;
        this.customer = customer;
        this.mobilenumber = "";
        this.address = "";
        this.items = items;
        this.type = type;
        this.amount = amount;
        this.status = status;
        this.issueDate = issueDate;
        this.grossAmount = amount;
        this.netAmount = amount;
        this.discount = BigDecimal.ZERO;
        this.makingCharge = BigDecimal.ZERO;
        this.gstRate = BigDecimal.valueOf(0.03);
        this.paymentMethod = "CASH";
    }

    public InvoiceEntity(String invoiceId, String customer, String mobilenumber, String address,
            List<InvoiceItemDto> items,
            String type,
            BigDecimal amount, String status,
            LocalDate issueDate, BigDecimal grossAmount, BigDecimal netAmount, BigDecimal discount,
            BigDecimal makingCharge, BigDecimal gstRate, String paymentMethod) {
        this.invoiceId = invoiceId;
        this.customer = customer;
        this.mobilenumber = mobilenumber;
        this.address = address;
        this.items = items;
        this.type = type;
        this.amount = amount;
        this.status = status;
        this.issueDate = issueDate;
        this.grossAmount = grossAmount;
        this.netAmount = netAmount;
        this.discount = discount;
        this.makingCharge = makingCharge;
        this.gstRate = gstRate;
        this.paymentMethod = paymentMethod;
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

    public String getMobilenumber() {
        return mobilenumber;
    }

    public String getAddress() {
        return address;
    }

    public List<InvoiceItemDto> getItems() {
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

    public BigDecimal getGrossAmount() {
        return grossAmount;
    }

    public BigDecimal getNetAmount() {
        return netAmount;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public BigDecimal getMakingCharge() {
        return makingCharge;
    }

    public BigDecimal getGstRate() {
        return gstRate;
    }

    public String getShopId() {
        return shopId;
    }

    public void setShopId(String shopId) {
        this.shopId = shopId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
