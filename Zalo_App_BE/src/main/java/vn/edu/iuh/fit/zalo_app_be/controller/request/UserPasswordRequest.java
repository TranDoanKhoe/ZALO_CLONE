
package vn.edu.iuh.fit.zalo_app_be.controller.request;


import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class UserPasswordRequest {
    private String oldPassword;
    private String newPassword;
}
