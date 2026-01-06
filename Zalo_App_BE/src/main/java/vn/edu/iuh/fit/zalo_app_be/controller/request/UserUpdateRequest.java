

package vn.edu.iuh.fit.zalo_app_be.controller.request;

import lombok.Getter;
import vn.edu.iuh.fit.zalo_app_be.common.Gender;
import vn.edu.iuh.fit.zalo_app_be.common.UserStatus;

import java.util.Date;

@Getter
public class UserUpdateRequest {
    private String firstName;
    private String lastName;
    private Date birthday;
    private String email;
    private String phone;
    private Gender gender;
}
