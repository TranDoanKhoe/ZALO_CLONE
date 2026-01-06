/*
 * @ (#) LogoutResponse.java       1.0     4/12/2025
 *
 * Copyright (c) 2025. All rights reserved.
 */

package vn.edu.iuh.fit.zalo_app_be.controller.response;
/*
 * @author: Luong Tan Dat
 * @date: 4/12/2025
 */

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class LogoutResponse {
    private String message;
}
