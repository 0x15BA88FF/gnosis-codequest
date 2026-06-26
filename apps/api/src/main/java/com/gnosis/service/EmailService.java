package com.gnosis.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final Resend resend;
    private final String fromAddress;

    public EmailService(@Value("${resend.api-key}") String apiKey) {
        this.resend = new Resend(apiKey);
        this.fromAddress = "noreply@gnosis.app";
    }

    public void sendVerificationEmail(String to, String token) {
        send(to, "Verify your email",
                "Click the link to verify your email: " + verificationLink(token));
    }

    public void sendInviteEmail(String to, String inviterName, String mindName, String token) {
        send(to, "You're invited to " + mindName,
                inviterName + " invited you to join " + mindName + " on Gnosis.\n\n"
                        + "Accept the invite: " + inviteLink(token));
    }

    public void sendNotificationEmail(String to, String title, String body) {
        send(to, title, body);
    }

    private void send(String to, String subject, String body) {
        CreateEmailOptions params = CreateEmailOptions.builder()
                .from(fromAddress)
                .to(to)
                .subject(subject)
                .text(body)
                .build();
        try {
            CreateEmailResponse response = resend.emails().send(params);
        } catch (ResendException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    private String verificationLink(String token) {
        return "http://localhost:8080/api/v1/auth/verify-email?token=" + token;
    }

    private String inviteLink(String token) {
        return "http://localhost:8080/api/v1/invites/accept?token=" + token;
    }
}
