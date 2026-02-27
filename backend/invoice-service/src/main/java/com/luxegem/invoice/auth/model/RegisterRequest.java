package com.luxegem.invoice.auth.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;

public record RegisterRequest(
        @NotBlank String username,
        @NotBlank String password,
        @NotBlank @Email String email,
        @NotBlank String shopName,
        String gstNumber,
        String address,
        String contactNumber,
        String logoUrl) {
}
