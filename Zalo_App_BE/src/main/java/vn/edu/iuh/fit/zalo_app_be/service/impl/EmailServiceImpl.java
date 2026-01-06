
package vn.edu.iuh.fit.zalo_app_be.service.impl;


import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.zalo_app_be.service.EmailService;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "EMAIL-SERVICE")
public class EmailServiceImpl implements EmailService {
    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.reset-code-expiry-minutes}")
    private int resetCodeExpiryMinutes;

    private String appName = "Zalo App";

    @Override
    public void sendPasswordResetEmail(String email, String code) {
        String subject = "Reset Your Password";
        String content = buildEmailContent(email, code);

        try{
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            setEmailContent(message, helper, subject, content, email);
            javaMailSender.send(message);
            log.info("Password reset email sent to: {}", email);
        }catch (MessagingException e){
            log.error("Error while creating email message: {}", e.getMessage());
            throw new RuntimeException("Failed to create email message", e);
        }
    }

    @Override
    public void sendVerificationEmail(String email, String code) {
        String subject = "Verify Your Email";
        String content = buildEmailContentForVerificationEmail(email, code);

        try{
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            setEmailContent(message, helper, subject, content, email);
            javaMailSender.send(message);
            log.info("Verification email sent to: {}", email);
        }catch (MessagingException e){
            log.error("Error while creating email message: {}", e.getMessage());
            throw new RuntimeException("Failed to create email message", e);
        }
    }


    private void setEmailContent(MimeMessage message, MimeMessageHelper helper, String subject, String content, String email) throws MessagingException {
        helper.setTo(email);
        helper.setSubject(subject);
        helper.setText(content, true);
    }

    /**
     * Builds the HTML content for the password reset email.
     *
     * @param email the recipient's email address
     * @param code  the password reset code
     * @return the HTML email content
     */
    private String buildEmailContent(String email, String code) {
        return "<!DOCTYPE html>" +
                "<html><head><style>" +
                "body { font-family: Arial, sans-serif; color: #333; }" +
                ".container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }" +
                ".header { text-align: center; }" +
                ".code { font-size: 24px; font-weight: bold; color: #007bff; text-align: center; margin: 20px 0; }" +
                ".footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }" +
                "</style></head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'>" +
                "<h2>Reset Your " + appName + " Password</h2>" +
                "</div>" +
                "<p>Dear user,</p>" +
                "<p>You have requested to reset your password. Please use the following code to proceed:</p>" +
                "<div class='code'>" + code + "</div>" +
                "<p>This code will expire in " + resetCodeExpiryMinutes + " minutes.</p>" +
                "<p>If you did not request a password reset, please ignore this email or contact support.</p>" +
                "<div class='footer'>" +
                "<p>&copy; " + LocalDateTime.now().getYear() + " " + appName + ". All rights reserved.</p>" +
                "</div>" +
                "</div>" +
                "</body></html>";
    }

   /**
     * Builds the HTML content for the email verification email.
     *
     * @param email the recipient's email address
     * @param code  the verification code
     * @return the HTML email content
     */
    private String buildEmailContentForVerificationEmail(String email, String code) {
        return "<!DOCTYPE html>" +
               "<html><head><style>" +
               "body { font-family: Arial, sans-serif; color: #333; }" +
               ".container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }" +
               ".header { text-align: center; }" +
               ".code { font-size: 24px; font-weight: bold; color: #007bff; text-align: center; margin: 20px 0; }" +
               ".footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }" +
               "</style></head>" +
               "<body>" +
               "<div class='container'>" +
               "<div class='header'>" +
               "<h2>Welcome to " + appName + "</h2>" +
               "</div>" +
               "<p>Dear user,</p>" +
               "<p>Thank you for registering with " + appName + ". To complete your registration, please use the following verification code:</p>" +
               "<div class='code'>" + code + "</div>" +
               "<p>This code will expire in " + resetCodeExpiryMinutes + " minutes.</p>" +
               "<p>If you did not attempt to register, please ignore this email or contact our support team.</p>" +
               "<p><a href='mailto:support@" + appName.toLowerCase().replace(" ", "") + ".com'>Contact Support</a></p>" +
               "<div class='footer'>" +
               "<p>© " + LocalDateTime.now().getYear() + " " + appName + ". All rights reserved.</p>" +
               "</div>" +
               "</div>" +
               "</body></html>";
    }
}
