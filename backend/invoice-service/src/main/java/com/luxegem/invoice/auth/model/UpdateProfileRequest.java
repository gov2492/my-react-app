package com.luxegem.invoice.auth.model;

public record UpdateProfileRequest(
        String shopName,
        String email,
        String contactNumber,
        String address,
        String gstNumber) {
}
