

package vn.edu.iuh.fit.zalo_app_be.service;


public interface EmailService {
    void sendPasswordResetEmail(String email, String code);
    void sendVerificationEmail(String email, String code);
}
