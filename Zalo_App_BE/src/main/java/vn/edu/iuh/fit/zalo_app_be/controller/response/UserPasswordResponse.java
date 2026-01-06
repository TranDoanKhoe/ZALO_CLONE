/*
 * @ (#) UserPasswordResponse.java       1.0     4/10/2025
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

@Getter
@Setter
@Builder
public class UserPasswordResponse {
    private String message;
}

