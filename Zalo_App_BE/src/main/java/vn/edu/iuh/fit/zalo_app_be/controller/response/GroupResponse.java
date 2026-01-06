/*
 * @ (#) GroupResponse.java       1.0     4/30/2025
 *
 * Copyright (c) 2025. All rights reserved.
 */

package vn.edu.iuh.fit.zalo_app_be.controller.response;
/*
 * @author: Luong Tan Dat
 * @date: 4/30/2025
 */

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.edu.iuh.fit.zalo_app_be.common.Roles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class GroupResponse {
    private String id;
    private String name;
    private String createId;
    private List<String> memberIds;
    private Map<String, Roles> roles; // userId -> role (admin, member)
    private String avatarGroup;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private boolean isActive;
}
