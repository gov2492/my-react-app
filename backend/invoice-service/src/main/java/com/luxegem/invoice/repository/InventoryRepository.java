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
            WHERE i.shopId = :shopId AND (
               lower(i.itemCode) LIKE lower(concat('%', :query, '%'))
               OR lower(i.itemName) LIKE lower(concat('%', :query, '%'))
               OR lower(i.category) LIKE lower(concat('%', :query, '%'))
               OR lower(i.metalType) LIKE lower(concat('%', :query, '%'))
            )
            ORDER BY i.updatedAt DESC
            """)
    List<InventoryEntity> searchByShopId(String shopId, String query);

    List<InventoryEntity> findAllByShopIdOrderByUpdatedAtDesc(String shopId);

    // New methods for billing
    Optional<InventoryEntity> findByItemCode(String itemCode);

    List<InventoryEntity> findByCategory(String category);

    List<InventoryEntity> findByStockQuantityLessThanEqual(Integer stockQuantity);
}
