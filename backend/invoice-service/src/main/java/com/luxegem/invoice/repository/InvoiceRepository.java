package com.luxegem.invoice.repository;

import com.luxegem.invoice.entity.InvoiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<InvoiceEntity, Long>, JpaSpecificationExecutor<InvoiceEntity> {
    List<InvoiceEntity> findTop10ByShopIdOrderByIssueDateDesc(String shopId);

    long countByShopIdAndStatus(String shopId, String status);

    List<InvoiceEntity> findByShopIdAndIssueDate(String shopId, LocalDate issueDate);

    Optional<InvoiceEntity> findTopByOrderByIdDesc();

    // New method for billing
    Optional<InvoiceEntity> findByInvoiceId(String invoiceId);
}
