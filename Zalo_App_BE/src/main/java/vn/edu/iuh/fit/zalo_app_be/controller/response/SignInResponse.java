/*
 * @ (#) TokenResponse.java       1.0     4/9/2025
 *
 * Copyright (c) 2025. All rights reserved.
 */

package vn.edu.iuh.fit.zalo_app_be.controller.response;
/*
 * @author: Luong Tan Dat
 * @date: 4/9/2025
 */

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.edu.iuh.fit.zalo_app_be.common.UserActiveStatus;

import java.util.Date;

@Getter
@Setter
@Builder
public class SignInResponse {
    private String userId;
    private String username;
    private String accessToken;
    private String refreshToken;
    private UserActiveStatus activeStatus;
}
