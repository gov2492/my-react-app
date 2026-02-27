package com.luxegem.invoice.auth.model;

import jakarta.validation.constraints.NotBlank;

public record ResetPasswordRequest(
                @NotBlank String identifier,
                @NotBlank String otp,
                @NotBlank String newPassword) {
}
