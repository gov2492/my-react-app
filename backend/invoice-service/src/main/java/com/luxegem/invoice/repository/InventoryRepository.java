package com.luxegem.invoice.repository;

import com.luxegem.invoice.entity.InventoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<InventoryEntity, Long> {

    Optional<InventoryEntity> findTopByOrderByIdDesc();

    @Query("""
            SELECT i FROM InventoryEntity i
            WHERE lower(i.sku) LIKE lower(concat('%', :query, '%'))
               OR lower(i.itemName) LIKE lower(concat('%', :query, '%'))
               OR lower(i.type) LIKE lower(concat('%', :query, '%'))
            ORDER BY i.updatedAt DESC
            """)
    List<InventoryEntity> search(String query);

    List<InventoryEntity> findAllByOrderByUpdatedAtDesc();

    // New methods for billing
    Optional<InventoryEntity> findBySku(String sku);

    List<InventoryEntity> findByType(String type);

    List<InventoryEntity> findByQuantityLessThanEqual(Integer quantity);
}
