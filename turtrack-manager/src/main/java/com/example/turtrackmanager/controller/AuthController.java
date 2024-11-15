package com.example.turtrackmanager.controller;

import com.example.turtrackmanager.dto.UserDTO;
import com.example.turtrackmanager.model.turtrack.User;
import com.example.turtrackmanager.service.turtrack.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserDTO.AuthResponse> register(@Valid @RequestBody UserDTO.RegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<UserDTO.AuthResponse> login(@Valid @RequestBody UserDTO.LoginRequest request) {
        return ResponseEntity.ok(userService.authenticate(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO.AuthResponse> getCurrentUser(@RequestHeader("Authorization") String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        return ResponseEntity.ok(userService.getCurrentUser(token));
    }
}