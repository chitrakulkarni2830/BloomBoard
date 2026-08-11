package com.bloomboard.backend.controller;

import com.bloomboard.backend.controller.dto.LoginRequest;
import com.bloomboard.backend.controller.dto.LoginResponse;
import com.bloomboard.backend.security.CustomUserDetailsService;
import com.bloomboard.backend.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        final String jwt = jwtUtil.generateToken(userDetails.getUsername());
        
        // Extract role safely assuming at least one role exists
        String role = userDetails.getAuthorities().isEmpty() ? "" : userDetails.getAuthorities().iterator().next().getAuthority();

        return LoginResponse.builder()
                .token(jwt)
                .username(userDetails.getUsername())
                .role(role)
                .build();
    }
}
