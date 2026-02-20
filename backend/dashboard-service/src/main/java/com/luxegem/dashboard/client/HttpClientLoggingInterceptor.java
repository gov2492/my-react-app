package com.luxegem.dashboard.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

public class HttpClientLoggingInterceptor implements ClientHttpRequestInterceptor {

    private static final Logger logger = LoggerFactory.getLogger("http.requests");
    private static final Logger appLogger = LoggerFactory.getLogger(HttpClientLoggingInterceptor.class);

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution)
            throws IOException {

        logOutgoingRequest(request, body);

        long startTime = System.currentTimeMillis();
        ClientHttpResponse response = execution.execute(request, body);
        long duration = System.currentTimeMillis() - startTime;

        logIncomingResponse(response, duration);

        return response;
    }

    private void logOutgoingRequest(HttpRequest request, byte[] body) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n");
        sb.append("========== OUTGOING HTTP CLIENT REQUEST ==========\n");
        sb.append("Timestamp: ").append(System.currentTimeMillis()).append("\n");
        sb.append("Method: ").append(request.getMethod()).append(" ").append(request.getURI()).append("\n");

        sb.append("Headers: \n");
        request.getHeaders().forEach((headerName, headerValues) -> {
            String headerValue = String.join(", ", headerValues);
            if (headerName.equalsIgnoreCase("Authorization")) {
                headerValue = maskSensitiveData(headerValue);
            }
            sb.append("  ").append(headerName).append(": ").append(headerValue).append("\n");
        });

        if (body != null && body.length > 0) {
            String bodyStr = new String(body, StandardCharsets.UTF_8);
            sb.append("Body: ").append(bodyStr.length() > 500 ? bodyStr.substring(0, 500) + "..." : bodyStr).append("\n");
        }
        sb.append("===================================================\n");

        logger.debug(sb.toString());
        appLogger.debug("Outgoing Request: {} {}", request.getMethod(), request.getURI());
    }

    private void logIncomingResponse(ClientHttpResponse response, long duration) throws IOException {
        StringBuilder sb = new StringBuilder();
        sb.append("\n");
        sb.append("========== INCOMING HTTP CLIENT RESPONSE ==========\n");
        sb.append("Status: ").append(response.getRawStatusCode()).append(" ").append(response.getStatusText()).append("\n");
        sb.append("Duration: ").append(duration).append("ms\n");

        sb.append("Headers: \n");
        response.getHeaders().forEach((headerName, headerValues) -> {
            String headerValue = String.join(", ", headerValues);
            sb.append("  ").append(headerName).append(": ").append(headerValue).append("\n");
        });

        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(response.getBody(), StandardCharsets.UTF_8));
            String body = reader.lines().collect(Collectors.joining("\n"));
            if (!body.isEmpty()) {
                sb.append("Body: ").append(body.length() > 500 ? body.substring(0, 500) + "..." : body).append("\n");
            }
        } catch (Exception e) {
            sb.append("Body: Unable to read\n");
        }
        sb.append("===================================================\n");

        if (response.getRawStatusCode() >= 400) {
            appLogger.warn(sb.toString());
        } else {
            logger.debug(sb.toString());
        }
        appLogger.debug("Response Status: {} in {}ms", response.getRawStatusCode(), duration);
    }

    private String maskSensitiveData(String value) {
        if (value == null || value.length() <= 4) {
            return "***";
        }
        return value.substring(0, 4) + "***";
    }
}
