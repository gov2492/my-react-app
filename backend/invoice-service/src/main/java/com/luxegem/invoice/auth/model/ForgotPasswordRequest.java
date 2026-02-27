package com.luxegem.invoice.auth.model;

import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
                @NotBlank String identifier) {
}
