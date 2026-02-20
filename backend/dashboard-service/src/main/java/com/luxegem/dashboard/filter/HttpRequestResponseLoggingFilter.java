package com.luxegem.dashboard.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.*;

@Component
public class HttpRequestResponseLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger("http.requests");
    private static final Logger appLogger = LoggerFactory.getLogger(HttpRequestResponseLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long startTime = System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString();

        // Log Incoming Request
        logIncomingRequest(request, requestId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Log Outgoing Response
            long duration = System.currentTimeMillis() - startTime;
            logOutgoingResponse(response, requestId, duration);
        }
    }

    private void logIncomingRequest(HttpServletRequest request, String requestId) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n");
        sb.append("========== INCOMING HTTP REQUEST ==========\n");
        sb.append("RequestId: ").append(requestId).append("\n");
        sb.append("Timestamp: ").append(System.currentTimeMillis()).append("\n");
        sb.append("Method: ").append(request.getMethod()).append(" ").append(request.getRequestURI()).append("\n");
        sb.append("Protocol: ").append(request.getProtocol()).append("\n");
        sb.append("Remote Address: ").append(request.getRemoteAddr()).append("\n");
        sb.append("Session ID: ").append(request.getSession(false) != null ? request.getSession(false).getId() : "N/A").append("\n");

        // Headers
        sb.append("Headers: \n");
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            String headerValue = request.getHeader(headerName);
            // Mask sensitive headers
            if (headerName.equalsIgnoreCase("Authorization")) {
                headerValue = maskSensitiveData(headerValue);
            }
            sb.append("  ").append(headerName).append(": ").append(headerValue).append("\n");
        }

        sb.append("Query Parameters: \n");
        Enumeration<String> paramNames = request.getParameterNames();
        while (paramNames.hasMoreElements()) {
            String paramName = paramNames.nextElement();
            String paramValue = request.getParameter(paramName);
            sb.append("  ").append(paramName).append(": ").append(paramValue).append("\n");
        }
        sb.append("==========================================\n");

        logger.debug(sb.toString());
        appLogger.debug("Incoming Request: {} {} from {}", request.getMethod(), request.getRequestURI(), request.getRemoteAddr());
    }

    private void logOutgoingResponse(HttpServletResponse response, String requestId, long duration) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n");
        sb.append("========== OUTGOING HTTP RESPONSE ==========\n");
        sb.append("RequestId: ").append(requestId).append("\n");
        sb.append("Status: ").append(response.getStatus()).append("\n");
        sb.append("Duration: ").append(duration).append("ms\n");

        // Response Headers
        sb.append("Headers: \n");
        for (String headerName : response.getHeaderNames()) {
            String headerValue = response.getHeader(headerName);
            if (headerName.equalsIgnoreCase("Authorization") || headerName.equalsIgnoreCase("Set-Cookie")) {
                headerValue = maskSensitiveData(headerValue);
            }
            sb.append("  ").append(headerName).append(": ").append(headerValue).append("\n");
        }
        sb.append("===========================================\n");

        if (response.getStatus() >= 400) {
            appLogger.warn(sb.toString());
        } else {
            logger.debug(sb.toString());
        }
        appLogger.debug("Response Status: {} in {}ms", response.getStatus(), duration);
    }

    private String maskSensitiveData(String value) {
        if (value == null || value.length() <= 4) {
            return "***";
        }
        return value.substring(0, 4) + "***";
    }
}
