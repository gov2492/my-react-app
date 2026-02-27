package com.luxegem.invoice.auth.model;

public record UserDetailsResponse(
                Long id,
                String username,
                String email,
                String role,
                String shopName,
                String shopId,
                String gstNumber,
                String contactNumber,
                String address,
                String logoUrl,
                boolean enabled) {
}
