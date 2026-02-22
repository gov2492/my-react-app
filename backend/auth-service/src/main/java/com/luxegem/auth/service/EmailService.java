package com.luxegem.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    private final String fromEmail;
    private final String configuredUsername;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from}") String fromEmail,
            @Value("${spring.mail.username:}") String configuredUsername) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
        this.configuredUsername = configuredUsername;
    }

    public void sendPasswordResetEmail(String toEmail, String otp) {
        if (toEmail == null || toEmail.isBlank()) {
            logger.warn("Cannot send OTP email because recipient email is empty");
            return;
        }

        String subject = "Your OTP for Password Reset";
        String body = "Your one-time password (OTP) is: " + otp + "\n"
                + "This OTP expires in 5 minutes.\n"
                + "If you did not request this, you can ignore this email.";

        if (configuredUsername == null || configuredUsername.isBlank()) {
            logger.info("MAIL_USERNAME not configured. OTP for {} is {}", toEmail, otp);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);
        try {
            mailSender.send(message);
        } catch (Exception ex) {
            logger.error("Failed to send OTP email to {}", toEmail, ex);
        }
    }
}
