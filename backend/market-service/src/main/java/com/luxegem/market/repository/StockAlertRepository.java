package com.luxegem.market.repository;

import com.luxegem.market.entity.StockAlertEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockAlertRepository extends JpaRepository<StockAlertEntity, Long> {
}
