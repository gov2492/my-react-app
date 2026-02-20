package com.luxegem.auth.controller;

import com.luxegem.auth.model.AppUser;
import com.luxegem.auth.model.AuthResponse;
import com.luxegem.auth.model.LoginRequest;
import com.luxegem.auth.model.RegisterRequest;
import com.luxegem.auth.repository.AppUserRepository;
import com.luxegem.auth.security.JwtTokenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenService jwtTokenService;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            AuthenticationManager authenticationManager,
            JwtTokenService jwtTokenService,
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenService = jwtTokenService;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        var user = appUserRepository.findByUsername(request.username()).orElseThrow();
        String token = jwtTokenService.generateToken(user.getUsername(), user.getRole());
        return new AuthResponse(token, "Bearer", jwtTokenService.expirationSeconds());
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        if (appUserRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        AppUser user = appUserRepository.save(
                new AppUser(request.username(), passwordEncoder.encode(request.password()), "USER")
        );

        String token = jwtTokenService.generateToken(user.getUsername(), user.getRole());
        return new AuthResponse(token, "Bearer", jwtTokenService.expirationSeconds());
    }
}
