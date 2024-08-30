package com.example.turtrackmanager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Allow all origins - you may want to restrict this in production
        config.addAllowedOrigin("*");

        // Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
        config.addAllowedMethod("*");

        // Allow all headers
        config.addAllowedHeader("*");

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
