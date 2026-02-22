package com.luxegem.auth.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyOtpRequest(
        @NotBlank String identifier,
        @NotBlank @Size(min = 6, max = 6) String otp) {
}
