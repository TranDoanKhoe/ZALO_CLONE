/*
 * @ (#) FriendResponse.java       1.0     4/20/2025
 *
 * Copyright (c) 2025. All rights reserved.
 */

package vn.edu.iuh.fit.zalo_app_be.controller.response;
/*
 * @author: Luong Tan Dat
 * @date: 4/20/2025
 */

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.edu.iuh.fit.zalo_app_be.common.Gender;
import vn.edu.iuh.fit.zalo_app_be.common.UserActiveStatus;

import java.util.Date;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class FriendResponse {
    private String id;
    private String name;
    private String avatar;
    private String phone;
    private Date birthday;
    private Gender gender;
    private UserActiveStatus activeStatus;
}
