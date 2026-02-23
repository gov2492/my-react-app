package com.luxegem.unified;

import com.luxegem.auth.config.SecurityConfig;
import com.luxegem.auth.filter.HttpRequestResponseLoggingFilter;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

@SpringBootApplication
@ComponentScan(
        basePackages = "com.luxegem",
        excludeFilters = {
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {
                        SecurityConfig.class,
                        com.luxegem.invoice.config.SecurityConfig.class,
                        com.luxegem.market.config.SecurityConfig.class,
                        com.luxegem.dashboard.security.SecurityConfig.class,
                        HttpRequestResponseLoggingFilter.class,
                        com.luxegem.market.filter.HttpRequestResponseLoggingFilter.class,
                        com.luxegem.dashboard.filter.HttpRequestResponseLoggingFilter.class,
                        com.luxegem.market.security.JwtAuthenticationFilter.class,
                        com.luxegem.market.security.JwtService.class,
                        com.luxegem.dashboard.security.JwtAuthenticationFilter.class,
                        com.luxegem.dashboard.security.JwtService.class
                })
        }
)
public class UnifiedServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UnifiedServiceApplication.class, args);
    }
}
