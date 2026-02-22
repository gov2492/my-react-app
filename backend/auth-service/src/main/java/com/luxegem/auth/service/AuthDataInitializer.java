package com.luxegem.auth.service;

import com.luxegem.auth.model.AppUser;
import com.luxegem.auth.repository.AppUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Map;

@Component
public class AuthDataInitializer implements CommandLineRunner {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthDataInitializer(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        ensureUser("admin", "gov123singh#", "admin");
    }

    private void ensureUser(String username, String password, String role) {
        var existing = appUserRepository.findByUsername(username);

        if (existing.isPresent()) {
            AppUser user = existing.get();
            boolean changed = false;
            if (user.getShopName() == null || user.getShopName().isBlank()) {
                user.setShopName(defaultShopName(username));
                changed = true;
            }
            if (user.getEmail() == null || user.getEmail().isBlank()) {
                user.setEmail(username + "@example.com");
                changed = true;
            }
            if (user.getShopId() == null || user.getShopId().isBlank()) {
                user.setShopId(username);
                changed = true;
            }
            // Always ensure the admin account password matches the desired default in case
            // it was created with an old password.
            if ("admin".equals(username)) {
                user.setPasswordHash(passwordEncoder.encode(password));
                changed = true;
            }

            if (changed) {
                appUserRepository.save(user);
            }
            return;
        }

        appUserRepository.save(new AppUser(
                username,
                passwordEncoder.encode(password),
                role,
                defaultShopName(username),
                username,
                username + "@example.com"));
    }

    private String defaultShopName(String username) {
        Map<String, String> map = Map.of(
                "admin", "Akash Jewellers",
                "akash", "Akash Jewellers",
                "luxegem", "LuxeGem Premium",
                "royal", "Royal Gold Palace",
                "shree", "Shree Diamond Era");
        String key = username.toLowerCase(Locale.ROOT);
        return map.getOrDefault(key, username + " Jewellers");
    }
}
