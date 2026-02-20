package com.luxegem.invoice.service;

import com.luxegem.invoice.entity.InvoiceEntity;
import com.luxegem.invoice.repository.InvoiceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class InvoiceDataInitializer implements CommandLineRunner {

    private final InvoiceRepository invoiceRepository;

    public InvoiceDataInitializer(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    @Override
    public void run(String... args) {
        if (invoiceRepository.count() > 0) {
            return;
        }

        invoiceRepository.saveAll(List.of(
                new InvoiceEntity("#INV-2045", "John Smith", "Gold Ring (5g)", "GOLD_22K", new BigDecimal("450.00"), "Paid", LocalDate.now()),
                new InvoiceEntity("#INV-2044", "Anna Lee", "Diamond Studs", "DIAMOND", new BigDecimal("1200.00"), "Pending", LocalDate.now()),
                new InvoiceEntity("#INV-2043", "Maria R.", "Gold Necklace", "GOLD_24K", new BigDecimal("3450.00"), "Paid", LocalDate.now()),
                new InvoiceEntity("#INV-2042", "John Doe", "Platinum Band", "PLATINUM", new BigDecimal("890.00"), "Draft", LocalDate.now().minusDays(1)),
                new InvoiceEntity("#INV-2041", "Rita Patel", "Silver Chain", "SILVER", new BigDecimal("320.00"), "Paid", LocalDate.now().minusDays(1))
        ));
    }
}
