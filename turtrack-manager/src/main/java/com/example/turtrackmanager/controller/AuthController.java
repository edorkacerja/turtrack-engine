package com.example.turtrackmanager.controller;

import com.example.turtrackmanager.dto.UserDTO;
import com.example.turtrackmanager.service.turtrack.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
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
        // TODO: Implement getting current user details
        return ResponseEntity.ok().build();
    }
}