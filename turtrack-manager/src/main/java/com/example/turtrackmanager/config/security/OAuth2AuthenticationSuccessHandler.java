package com.example.turtrackmanager.config.security;

import com.example.turtrackmanager.config.security.JwtTokenProvider;
import com.example.turtrackmanager.model.turtrack.User;
import com.example.turtrackmanager.repository.turtrack.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider; // Inject JwtTokenProvider
    private final String clientRedirectUri = "http://localhost:5173/oauth2/callback";

    public OAuth2AuthenticationSuccessHandler(UserRepository userRepository, JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        // Check if the user exists, if not, create a new user
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .firstName(oAuth2User.getAttribute("given_name"))
                    .lastName(oAuth2User.getAttribute("family_name"))
                    .provider(User.AuthProvider.GOOGLE)
                    .subscriptionStatus(User.SubscriptionStatus.NONE)
                    .isActive(true)
                    .build();
            return userRepository.save(newUser);
        });

        // Generate JWT and Refresh Tokens
        String token = jwtTokenProvider.generateToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        // Set tokens as secure, HTTP-only cookies
        setAuthCookies(response, token, refreshToken);

        // Redirect to frontend without tokens in URL
        String redirectUrl = UriComponentsBuilder.fromUriString(clientRedirectUri)
                .queryParam("success", "true")
                .build().toUriString();

        response.sendRedirect(redirectUrl);
    }

    private void setAuthCookies(HttpServletResponse response, String token, String refreshToken) {
        // Set JWT cookie
        if (token != null) {
            Cookie jwtCookie = new Cookie("token", token);
            jwtCookie.setHttpOnly(true);
            jwtCookie.setSecure(true); // Set to true in production (requires HTTPS)
            jwtCookie.setPath("/");
            jwtCookie.setMaxAge(15 * 60); // 15 minutes
            // Set SameSite attribute if needed
            // jwtCookie.setComment("SameSite=Strict"); // For Java versions that support it
            response.addCookie(jwtCookie);
        }

        // Set Refresh Token cookie
        if (refreshToken != null) {
            Cookie refreshCookie = new Cookie("refreshToken", refreshToken);
            refreshCookie.setHttpOnly(true);
            refreshCookie.setSecure(true);
            refreshCookie.setPath("/auth/refresh"); // Only sent to the refresh endpoint
            refreshCookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
            // Set SameSite attribute if needed
            // refreshCookie.setComment("SameSite=Strict");
            response.addCookie(refreshCookie);
        }
    }
}
