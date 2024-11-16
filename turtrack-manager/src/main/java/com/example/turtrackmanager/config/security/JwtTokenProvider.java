package com.example.turtrackmanager.config.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.refresh-secret}")
    private String jwtRefreshSecret;

    @Value("${app.jwt.expiration-milliseconds}")
    private long jwtExpirationInMs;

    @Value("${app.jwt.refresh-expiration-milliseconds}")
    private long jwtRefreshExpirationInMs;

    // Generate Access Token
    public String generateToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key)
                .compact();
    }

    // Generate Refresh Token
    public String generateRefreshToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtRefreshExpirationInMs);

        SecretKey key = Keys.hmacShaKeyFor(jwtRefreshSecret.getBytes(StandardCharsets.UTF_8));

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key)
                .compact();
    }

    // Validate Access Token
    public boolean validateToken(String authToken) {
        return validateToken(authToken, jwtSecret);
    }

    // Validate Refresh Token
    public boolean validateRefreshToken(String refreshToken) {
        return validateToken(refreshToken, jwtRefreshSecret);
    }

    private boolean validateToken(String token, String secret) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException ex) {
            log.error("Invalid JWT token: {}", ex.getMessage());
        }
        return false;
    }

    // Get email from Access Token
    public String getEmailFromJWT(String token) {
        return getEmailFromToken(token, jwtSecret);
    }

    // Get email from Refresh Token
    public String getEmailFromRefreshToken(String token) {
        return getEmailFromToken(token, jwtRefreshSecret);
    }

    private String getEmailFromToken(String token, String secret) {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }
}
