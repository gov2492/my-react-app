package com.luxegem.auth.model;

public record AuthResponse(String token, String tokenType, long expiresInSeconds) {
}
