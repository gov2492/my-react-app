package com.luxegem.invoice.market.repository;

import com.luxegem.invoice.market.entity.MarketRateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketRateRepository extends JpaRepository<MarketRateEntity, Long> {
}
