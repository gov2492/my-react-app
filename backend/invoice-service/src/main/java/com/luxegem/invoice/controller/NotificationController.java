package com.luxegem.invoice.controller;

import com.luxegem.invoice.model.CreateNotificationRequest;
import com.luxegem.invoice.model.MarkAllReadResponse;
import com.luxegem.invoice.model.NotificationResponse;
import com.luxegem.invoice.model.UnreadCountResponse;
import com.luxegem.invoice.security.JwtService;
import com.luxegem.invoice.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtService jwtService;

    public NotificationController(NotificationService notificationService, JwtService jwtService) {
        this.notificationService = notificationService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public List<NotificationResponse> listNotifications(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(defaultValue = "50") int limit,
            Principal principal) {
        String role = resolveRole(authorization);
        String shopId = resolveShopId(principal);
        return notificationService.list(shopId, role, limit);
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount(
            @RequestHeader("Authorization") String authorization,
            Principal principal) {
        String role = resolveRole(authorization);
        String shopId = resolveShopId(principal);
        return new UnreadCountResponse(notificationService.unreadCount(shopId, role));
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markAsRead(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authorization,
            Principal principal) {
        String role = resolveRole(authorization);
        String shopId = resolveShopId(principal);
        return notificationService.markAsRead(id, shopId, role);
    }

    @PatchMapping("/read-all")
    public MarkAllReadResponse markAllAsRead(
            @RequestHeader("Authorization") String authorization,
            Principal principal) {
        String role = resolveRole(authorization);
        String shopId = resolveShopId(principal);
        long updatedCount = notificationService.markAllAsRead(shopId, role);
        return new MarkAllReadResponse(updatedCount);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NotificationResponse createNotification(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody CreateNotificationRequest request,
            Principal principal) {
        String role = resolveRole(authorization);
        String shopId = resolveShopId(principal);
        return notificationService.createForContext(shopId, role, request);
    }

    private String resolveRole(String authorizationHeader) {
        try {
            String token = extractToken(authorizationHeader);
            String role = jwtService.extractRole(token);
            return (role == null || role.isBlank()) ? "shop" : role;
        } catch (Exception ignored) {
            return "shop";
        }
    }

    private String resolveShopId(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            return NotificationService.ADMIN_NOTIFICATION_SHOP_ID;
        }
        return principal.getName();
    }

    private String extractToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return "";
        }
        return authorizationHeader.substring(7);
    }
}
