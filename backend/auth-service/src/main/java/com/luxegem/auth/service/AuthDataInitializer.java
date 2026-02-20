package com.luxegem.auth.service;

import com.luxegem.auth.model.AppUser;
import com.luxegem.auth.repository.AppUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

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
        if (!appUserRepository.existsByUsername("admin")) {
            appUserRepository.save(new AppUser("admin", passwordEncoder.encode("admin123"), "ADMIN"));
        }
        if (!appUserRepository.existsByUsername("user")) {
            appUserRepository.save(new AppUser("user", passwordEncoder.encode("user123"), "USER"));
        }
    }
}
