package com.luxegem.invoice.repository;

import com.luxegem.invoice.entity.NotificationEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    List<NotificationEntity> findByShopIdOrderByCreatedAtDesc(String shopId, Pageable pageable);

    List<NotificationEntity> findByShopIdInOrderByCreatedAtDesc(List<String> shopIds, Pageable pageable);

    long countByShopIdAndIsReadFalse(String shopId);

    long countByShopIdInAndIsReadFalse(List<String> shopIds);

    Optional<NotificationEntity> findByIdAndShopId(Long id, String shopId);

    Optional<NotificationEntity> findByIdAndShopIdIn(Long id, List<String> shopIds);

    List<NotificationEntity> findByShopIdAndIsReadFalse(String shopId);

    List<NotificationEntity> findByShopIdInAndIsReadFalse(List<String> shopIds);
}
