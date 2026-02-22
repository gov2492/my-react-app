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

                InvoiceEntity inv1 = new InvoiceEntity("#INV-2045", "John Smith",
                                List.of(new com.luxegem.invoice.model.InvoiceItemDto("Gold Ring (5g)", "GOLD_22K", 5.0,
                                                450.0 / 5.0, 8.0, 3.0)),
                                "GOLD_22K", new BigDecimal("450.00"), "Paid", LocalDate.now());
                inv1.setShopId("akash");

                InvoiceEntity inv2 = new InvoiceEntity("#INV-2044", "Anna Lee",
                                List.of(new com.luxegem.invoice.model.InvoiceItemDto("Diamond Studs", "DIAMOND", 1.0,
                                                1200.0,
                                                15.0, 3.0)),
                                "DIAMOND", new BigDecimal("1200.00"), "Pending", LocalDate.now());
                inv2.setShopId("luxegem");

                InvoiceEntity inv3 = new InvoiceEntity("#INV-2043", "Maria R.",
                                List.of(new com.luxegem.invoice.model.InvoiceItemDto("Gold Necklace", "GOLD_24K", 25.0,
                                                3450.0 / 25.0, 8.0, 3.0)),
                                "GOLD_24K", new BigDecimal("3450.00"), "Paid", LocalDate.now());
                inv3.setShopId("royal");

                InvoiceEntity inv4 = new InvoiceEntity("#INV-2042", "John Doe",
                                List.of(new com.luxegem.invoice.model.InvoiceItemDto("Platinum Band", "PLATINUM", 8.0,
                                                890.0 / 8.0, 12.0, 3.0)),
                                "PLATINUM", new BigDecimal("890.00"), "Draft", LocalDate.now().minusDays(1));
                inv4.setShopId("shree");

                InvoiceEntity inv5 = new InvoiceEntity("#INV-2041", "Rita Patel",
                                List.of(new com.luxegem.invoice.model.InvoiceItemDto("Silver Chain", "SILVER", 50.0,
                                                320.0 / 50.0, 5.0, 3.0)),
                                "SILVER", new BigDecimal("320.00"), "Paid", LocalDate.now().minusDays(1));
                inv5.setShopId("akash");

                invoiceRepository.saveAll(List.of(inv1, inv2, inv3, inv4, inv5));
        }
}
