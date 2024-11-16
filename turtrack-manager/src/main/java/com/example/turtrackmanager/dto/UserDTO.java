package com.example.turtrackmanager.dto;

import com.example.turtrackmanager.model.turtrack.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

public class UserDTO {

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email should be valid")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;

        @NotBlank(message = "First name is required")
        private String firstName;

        @NotBlank(message = "Last name is required")
        private String lastName;

        private String profilePicture;
    }

    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email should be valid")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    @Builder
    public static class AuthResponse {
        private String token; // Access Token (JWT)
        private String refreshToken; // Refresh Token
        private String email;
        private String firstName;
        private String lastName;
        private String profilePicture;
        private User.SubscriptionStatus subscriptionStatus;
    }
}
