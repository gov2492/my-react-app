package com.luxegem.invoice.service;

import com.luxegem.invoice.entity.NotificationEntity;
import com.luxegem.invoice.model.CreateNotificationRequest;
import com.luxegem.invoice.model.NotificationResponse;
import com.luxegem.invoice.model.NotificationType;
import com.luxegem.invoice.repository.NotificationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class NotificationService {

    public static final String ADMIN_NOTIFICATION_SHOP_ID = "ADMIN";

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public List<NotificationResponse> list(String shopId, String role, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        Pageable pageable = PageRequest.of(0, safeLimit);
        String normalizedShopId = normalizeShopId(shopId);

        List<NotificationEntity> notifications = isAdmin(role)
                ? notificationRepository.findByShopIdInOrderByCreatedAtDesc(accessibleShopIds(normalizedShopId, role),
                        pageable)
                : notificationRepository.findByShopIdOrderByCreatedAtDesc(normalizedShopId, pageable);

        return notifications.stream().map(this::toResponse).toList();
    }

    public long unreadCount(String shopId, String role) {
        String normalizedShopId = normalizeShopId(shopId);
        if (isAdmin(role)) {
            return notificationRepository.countByShopIdInAndIsReadFalse(accessibleShopIds(normalizedShopId, role));
        }
        return notificationRepository.countByShopIdAndIsReadFalse(normalizedShopId);
    }

    @Transactional
    public NotificationResponse markAsRead(Long id, String shopId, String role) {
        NotificationEntity notification = findAccessibleNotification(id, normalizeShopId(shopId), role)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification = notificationRepository.save(notification);
        }

        return toResponse(notification);
    }

    @Transactional
    public long markAllAsRead(String shopId, String role) {
        String normalizedShopId = normalizeShopId(shopId);
        List<NotificationEntity> unreadNotifications = isAdmin(role)
                ? notificationRepository.findByShopIdInAndIsReadFalse(accessibleShopIds(normalizedShopId, role))
                : notificationRepository.findByShopIdAndIsReadFalse(normalizedShopId);

        if (unreadNotifications.isEmpty()) {
            return 0;
        }

        unreadNotifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unreadNotifications);
        return unreadNotifications.size();
    }

    @Transactional
    public NotificationResponse createForContext(String currentShopId, String role, CreateNotificationRequest request) {
        String targetShopId = resolveTargetShopId(normalizeShopId(currentShopId), role, request.shopId());
        NotificationType type = parseType(request.type());

        NotificationEntity notification = notificationRepository.save(
                new NotificationEntity(targetShopId, request.title().trim(), request.message().trim(), type));

        return toResponse(notification);
    }

    @Transactional
    public void createSystemNotification(String shopId, String title, String message, NotificationType type) {
        if (shopId == null || shopId.isBlank()) {
            return;
        }
        notificationRepository.save(new NotificationEntity(shopId, title, message, type));
    }

    private String resolveTargetShopId(String currentShopId, String role, String requestedShopId) {
        String normalizedCurrentShopId = normalizeShopId(currentShopId);

        String desiredShopId = requestedShopId == null ? "" : requestedShopId.trim();

        if (desiredShopId.isBlank()) {
            return isAdmin(role) ? ADMIN_NOTIFICATION_SHOP_ID : normalizedCurrentShopId;
        }

        if (!isAdmin(role) && !desiredShopId.equals(normalizedCurrentShopId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot create notification for another shop");
        }

        return desiredShopId;
    }

    private java.util.Optional<NotificationEntity> findAccessibleNotification(Long id, String shopId, String role) {
        if (isAdmin(role)) {
            return notificationRepository.findByIdAndShopIdIn(id, accessibleShopIds(shopId, role));
        }
        return notificationRepository.findByIdAndShopId(id, shopId);
    }

    private String normalizeShopId(String shopId) {
        if (shopId == null || shopId.isBlank()) {
            return ADMIN_NOTIFICATION_SHOP_ID;
        }
        return shopId;
    }

    private List<String> accessibleShopIds(String shopId, String role) {
        if (!isAdmin(role)) {
            return List.of(shopId);
        }

        String normalizedShopId = (shopId == null || shopId.isBlank()) ? ADMIN_NOTIFICATION_SHOP_ID : shopId;
        if (ADMIN_NOTIFICATION_SHOP_ID.equals(normalizedShopId)) {
            return List.of(ADMIN_NOTIFICATION_SHOP_ID);
        }
        return List.of(normalizedShopId, ADMIN_NOTIFICATION_SHOP_ID);
    }

    private boolean isAdmin(String role) {
        return role != null && role.equalsIgnoreCase("admin");
    }

    private NotificationType parseType(String value) {
        if (value == null || value.isBlank()) {
            return NotificationType.INFO;
        }

        try {
            return NotificationType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ignored) {
            return NotificationType.INFO;
        }
    }

    private NotificationResponse toResponse(NotificationEntity entity) {
        return new NotificationResponse(
                entity.getId(),
                entity.getShopId(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getType().name(),
                entity.isRead(),
                entity.getCreatedAt());
    }
}
