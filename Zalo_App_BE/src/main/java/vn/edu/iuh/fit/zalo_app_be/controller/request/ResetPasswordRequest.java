
package vn.edu.iuh.fit.zalo_app_be.controller.request;

import lombok.Getter;

@Getter
public class ResetPasswordRequest {
    private String token;
    private String newPassword;
}
