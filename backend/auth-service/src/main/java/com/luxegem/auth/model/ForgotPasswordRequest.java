package com.luxegem.auth.model;

import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
                @NotBlank String identifier) {
}
