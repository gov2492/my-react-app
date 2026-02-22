package com.luxegem.dashboard.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateNotificationRequest(
        String shopId,
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(max = 600) String message,
        String type) {
}
