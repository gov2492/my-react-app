package com.luxegem.dashboard.model;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String shopId,
        String title,
        String message,
        String type,
        boolean isRead,
        LocalDateTime createdAt) {
}
