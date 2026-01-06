/*
 * @ (#) UserResponse.java       1.0     4/11/2025
 *
 * Copyright (c) 2025. All rights reserved.
 */

package vn.edu.iuh.fit.zalo_app_be.controller.response;
/*
 * @author: Luong Tan Dat
 * @date: 4/11/2025
 */

import lombok.*;
import vn.edu.iuh.fit.zalo_app_be.common.Gender;
import vn.edu.iuh.fit.zalo_app_be.common.UserStatus;

import java.time.LocalDateTime;
import java.util.Date;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private String id;
    private String username;
    private String firstName;
    private String lastName;
    private Date birthday;
    private String email;
    private String phone;
    private Gender gender;
    private UserStatus status;
    private String avatar;
    private LocalDateTime createdAt;
    private LocalDateTime updateAt;
}