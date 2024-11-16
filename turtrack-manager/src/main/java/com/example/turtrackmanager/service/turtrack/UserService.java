package com.example.turtrackmanager.service.turtrack;

import com.example.turtrackmanager.config.security.JwtTokenProvider;
import com.example.turtrackmanager.dto.UserDTO;
import com.example.turtrackmanager.model.turtrack.User;
import com.example.turtrackmanager.repository.turtrack.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public UserDTO.AuthResponse register(UserDTO.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .provider(User.AuthProvider.LOCAL)
                .subscriptionStatus(User.SubscriptionStatus.NONE)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        // Generate tokens
        String token = jwtTokenProvider.generateToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        return createAuthResponse(user, token, refreshToken);
    }

    public UserDTO.AuthResponse authenticate(UserDTO.LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate tokens
        String token = jwtTokenProvider.generateToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        return createAuthResponse(user, token, refreshToken);
    }

    public UserDTO.AuthResponse refreshAccessToken(String refreshToken) {
        if (jwtTokenProvider.validateRefreshToken(refreshToken)) {
            String email = jwtTokenProvider.getEmailFromRefreshToken(refreshToken);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Generate new access token
            String newToken = jwtTokenProvider.generateToken(user.getEmail());

            return createAuthResponse(user, newToken, null); // No need to return refresh token again
        } else {
            throw new RuntimeException("Invalid refresh token");
        }
    }

    private UserDTO.AuthResponse createAuthResponse(User user, String token, String refreshToken) {
        return UserDTO.AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .subscriptionStatus(user.getSubscriptionStatus())
                .build();
    }

    public UserDTO.AuthResponse getCurrentUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return UserDTO.AuthResponse.builder()
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .profilePicture(user.getImageUrl())
                .subscriptionStatus(user.getSubscriptionStatus())
                .build();
    }
}
