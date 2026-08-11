package com.bloomboard.backend.controller;

import com.bloomboard.backend.controller.dto.LoginRequest;
import com.bloomboard.backend.controller.dto.LoginResponse;
import com.bloomboard.backend.security.CustomUserDetailsService;
import com.bloomboard.backend.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthController authController;

    @Test
    void testLoginSuccess() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("password");

        UserDetails userDetails = new User("admin", "password", Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")));

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("admin", "password", userDetails.getAuthorities()));

        when(userDetailsService.loadUserByUsername("admin")).thenReturn(userDetails);
        when(jwtUtil.generateToken("admin")).thenReturn("mock-jwt-token");

        LoginResponse response = authController.login(loginRequest);

        assertEquals("mock-jwt-token", response.getToken());
        assertEquals("admin", response.getUsername());
        assertEquals("ROLE_ADMIN", response.getRole());
    }
}
