package com.example.turtrackmanager.config.security;

import com.example.turtrackmanager.dto.UserDTO;
import com.example.turtrackmanager.model.turtrack.User;
import com.example.turtrackmanager.repository.turtrack.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final String clientRedirectUri = "http://localhost:5173/oauth/callback";

    public OAuth2AuthenticationSuccessHandler(JwtTokenProvider jwtService,
                                              UserRepository userRepository,
                                              ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        // Get user details
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtService.generateToken(email);

        // Create auth response object
        UserDTO.AuthResponse authResponse = UserDTO.AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .subscriptionStatus(user.getSubscriptionStatus())
                .build();

        // Add auth response as a header
        response.setHeader("X-Auth-Response", objectMapper.writeValueAsString(authResponse));

        String redirectUrl = UriComponentsBuilder.fromUriString(clientRedirectUri)
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}