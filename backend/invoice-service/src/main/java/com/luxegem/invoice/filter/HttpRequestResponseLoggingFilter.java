package com.luxegem.invoice.filter;

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

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long startTime = System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString();

        logIncomingRequest(request, requestId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            logOutgoingResponse(response, requestId, duration);
        }
    }

    private void logIncomingRequest(HttpServletRequest request, String requestId) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n========== INCOMING HTTP REQUEST ==========\n");
        sb.append("RequestId: ").append(requestId).append("\n");
        sb.append("Method: ").append(request.getMethod()).append(" ").append(request.getRequestURI()).append("\n");
        sb.append("Remote Address: ").append(request.getRemoteAddr()).append("\n");

        sb.append("Headers: \n");
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            String headerValue = maskSensitiveData(request.getHeader(headerName), headerName);
            sb.append("  ").append(headerName).append(": ").append(headerValue).append("\n");
        }
        sb.append("==========================================\n");

        logger.debug(sb.toString());
    }

    private void logOutgoingResponse(HttpServletResponse response, String requestId, long duration) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n========== OUTGOING HTTP RESPONSE ==========\n");
        sb.append("RequestId: ").append(requestId).append("\n");
        sb.append("Status: ").append(response.getStatus()).append(" | Duration: ").append(duration).append("ms\n");
        sb.append("===========================================\n");

        logger.debug(sb.toString());
    }

    private String maskSensitiveData(String value, String headerName) {
        if (headerName.equalsIgnoreCase("Authorization") && value != null && value.length() > 4) {
            return value.substring(0, 4) + "***";
        }
        return value;
    }
}
