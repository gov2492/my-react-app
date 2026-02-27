package com.luxegem.invoice.auth.model;

public record AuthResponse(String token, String tokenType, long expiresInSeconds, String shopName, String shopId,
        String role, String logoUrl, String email, String address, String contactNumber, String gstNumber) {
}
