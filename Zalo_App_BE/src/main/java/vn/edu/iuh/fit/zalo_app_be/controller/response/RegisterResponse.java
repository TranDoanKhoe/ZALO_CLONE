/*
 * @ (#) RegisterResponse.java       1.0     4/10/2025
 *
 * Copyright (c) 2025. All rights reserved.
 */

package vn.edu.iuh.fit.zalo_app_be.controller.response;
/*
 * @author: Luong Tan Dat
 * @date: 4/10/2025
 */

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.edu.iuh.fit.zalo_app_be.common.Gender;
import vn.edu.iuh.fit.zalo_app_be.common.UserActiveStatus;
import vn.edu.iuh.fit.zalo_app_be.common.UserStatus;

import java.util.Date;

@Getter
@Setter
@Builder
public class RegisterResponse {
    private String userId;
    private String firstName;
    private String lastName;
    private Date birthday;
    private String email;
    private String phone;
    private Gender gender;
    private UserStatus status;
    private String avatar;
    private String username;
    private String password;
    private UserActiveStatus activeStatus;
    private String accessToken;
    private String refreshToken;
}
