package com.luxegem.auth.controller;

import com.luxegem.auth.model.AppUser;
import com.luxegem.auth.model.AuthResponse;
import com.luxegem.auth.model.LoginRequest;
import com.luxegem.auth.model.RegisterRequest;
import com.luxegem.auth.model.ForgotPasswordRequest;
import com.luxegem.auth.model.ResetPasswordRequest;
import com.luxegem.auth.model.VerifyOtpRequest;
import com.luxegem.auth.model.PasswordResetToken;
import com.luxegem.auth.model.UserDetailsResponse;
import com.luxegem.auth.repository.AppUserRepository;
import com.luxegem.auth.repository.PasswordResetTokenRepository;
import com.luxegem.auth.security.JwtTokenService;
import com.luxegem.auth.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;
import java.util.UUID;
import java.util.Random;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenService jwtTokenService;
    private final AppUserRepository appUserRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            AuthenticationManager authenticationManager,
            JwtTokenService jwtTokenService,
            AppUserRepository appUserRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenService = jwtTokenService;
        this.appUserRepository = appUserRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));

        var user = appUserRepository.findByUsername(request.username()).orElseThrow();

        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Your account has been disabled. Please contact support.");
        }

        boolean changed = false;
        if (user.getShopId() == null || user.getShopId().isBlank()) {
            // Keep legacy accounts compatible with historical username-based shop IDs.
            user.setShopId(user.getUsername());
            changed = true;
        }
        if (user.getShopName() == null || user.getShopName().isBlank()) {
            user.setShopName(resolveShopName(user.getUsername(), null));
            changed = true;
        }
        if (changed) {
            user = appUserRepository.save(user);
        }

        String token = jwtTokenService.generateToken(user.getUsername(), user.getRole(), user.getShopId());
        return new AuthResponse(token, "Bearer", jwtTokenService.expirationSeconds(), user.getShopName(),
                user.getShopId(), user.getRole(), user.getLogoUrl(), user.getEmail(), user.getAddress(),
                user.getContactNumber(), user.getGstNumber());
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        if (appUserRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        AppUser user = new AppUser(
                request.username(),
                passwordEncoder.encode(request.password()),
                "shop",
                request.shopName() != null ? request.shopName() : resolveShopName(request.username(), null),
                UUID.randomUUID().toString(),
                request.email());
        user.setGstNumber(request.gstNumber());
        user.setAddress(request.address());
        user.setContactNumber(request.contactNumber());
        user.setLogoUrl(request.logoUrl());

        user = appUserRepository.save(user);

        String token = jwtTokenService.generateToken(user.getUsername(), user.getRole(), user.getShopId());
        return new AuthResponse(token, "Bearer", jwtTokenService.expirationSeconds(), user.getShopName(),
                user.getShopId(), user.getRole(), user.getLogoUrl(), user.getEmail(), user.getAddress(),
                user.getContactNumber(), user.getGstNumber());
    }

    @PostMapping("/forgot-password")
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        AppUser user = appUserRepository.findByEmail(request.identifier())
                .orElseGet(() -> appUserRepository.findByUsername(request.identifier())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Account not found. Please check your username or email.")));

        String otp = String.format("%06d", new Random().nextInt(999999));

        // Invalidate old tokens for this user
        passwordResetTokenRepository.deleteByUser_Id(user.getId());

        PasswordResetToken resetToken = new PasswordResetToken(otp, user);
        passwordResetTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(user.getEmail(), otp);
    }

    @PostMapping("/verify-otp")
    public void verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AppUser user = appUserRepository.findByEmail(request.identifier())
                .orElseGet(() -> appUserRepository.findByUsername(request.identifier())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found")));

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenAndUser(request.otp(), user)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP. Please try again."));

        if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP expired. Please request a new one.");
        }
    }

    @PostMapping("/reset-password")
    @Transactional
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        AppUser user = appUserRepository.findByEmail(request.identifier())
                .orElseGet(() -> appUserRepository.findByUsername(request.identifier())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found")));

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenAndUser(request.otp(), user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP"));

        if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP expired. Please request a new one.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        appUserRepository.save(user);

        passwordResetTokenRepository.delete(resetToken);
    }

    @GetMapping("/users")
    public List<UserDetailsResponse> getAllUsers() {
        return appUserRepository.findAll().stream()
                .map(user -> new UserDetailsResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getRole(),
                        user.getShopName(),
                        user.getShopId(),
                        user.getGstNumber(),
                        user.getContactNumber(),
                        user.getAddress(),
                        user.getLogoUrl(),
                        user.isEnabled()))
                .collect(Collectors.toList());
    }

    @PostMapping("/users/{id}/toggle-status")
    @Transactional
    public UserDetailsResponse toggleUserStatus(@PathVariable Long id) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot disable main admin account");
        }

        user.setEnabled(!user.isEnabled());
        user = appUserRepository.save(user);

        return new UserDetailsResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getShopName(),
                user.getShopId(),
                user.getGstNumber(),
                user.getContactNumber(),
                user.getAddress(),
                user.getLogoUrl(),
                user.isEnabled());
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public void deleteUser(@PathVariable Long id) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot delete main admin account");
        }

        passwordResetTokenRepository.deleteByUser_Id(id);
        appUserRepository.delete(user);
    }

    private String resolveShopName(String username, String storedShopName) {
        if (storedShopName != null && !storedShopName.isBlank()) {
            return storedShopName;
        }

        Map<String, String> defaultShops = Map.of(
                "admin", "Akash Jewellers",
                "akash", "Akash Jewellers",
                "luxegem", "LuxeGem Premium",
                "royal", "Royal Gold Palace",
                "shree", "Shree Diamond Era");

        String key = username == null ? "" : username.toLowerCase(Locale.ROOT);
        return defaultShops.getOrDefault(key, titleCase(username) + " Jewellers");
    }

    private String titleCase(String value) {
        if (value == null || value.isBlank()) {
            return "My";
        }
        String trimmed = value.trim();
        return trimmed.substring(0, 1).toUpperCase(Locale.ROOT) + trimmed.substring(1).toLowerCase(Locale.ROOT);
    }
}
