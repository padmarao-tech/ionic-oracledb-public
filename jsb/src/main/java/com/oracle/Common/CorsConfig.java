package com.oracle.Common;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(Arrays.asList("*")); // Use patterns instead of origins
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE")); // Allow specific HTTP methods
        config.setAllowedHeaders(Arrays.asList("*")); // Allow all headers
        config.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "x-token")); // Expose additional headers to the client
        config.setMaxAge(3600L); // Max age of the CORS options request
        config.setAllowCredentials(true); // Allow credentials (cookies, authorization headers, etc.)

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
