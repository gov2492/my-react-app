package com.luxegem.invoice.market.repository;

import com.luxegem.invoice.market.entity.StockAlertEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockAlertRepository extends JpaRepository<StockAlertEntity, Long> {
}
