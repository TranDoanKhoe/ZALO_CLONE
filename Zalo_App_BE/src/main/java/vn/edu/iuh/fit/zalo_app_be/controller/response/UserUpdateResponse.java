/*
 * @ (#) UserUpdateResponse.java       1.0     4/11/2025
 *
 * Copyright (c) 2025. All rights reserved.
 */

package vn.edu.iuh.fit.zalo_app_be.controller.response;
/*
 * @author: Luong Tan Dat
 * @date: 4/11/2025
 */

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.edu.iuh.fit.zalo_app_be.common.Gender;
import vn.edu.iuh.fit.zalo_app_be.common.UserStatus;

import java.time.LocalDateTime;
import java.util.Date;

@Setter
@Getter
@Builder
public class UserUpdateResponse {
    private String firstName;
    private String lastName;
    private Date birthday;
    private String email;
    private String phone;
    private Gender gender;
    private UserStatus status;
    private String avatar;
    private String username;
    private LocalDateTime createdAt;
    private LocalDateTime updateAt;
}
