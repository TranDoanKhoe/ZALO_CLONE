
package vn.edu.iuh.fit.zalo_app_be.controller.request;


import lombok.Getter;
import lombok.Setter;
import vn.edu.iuh.fit.zalo_app_be.common.Roles;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class GroupRequest {
    private String id;
    private String name;
    private String createId;
    private List<String> memberIds;
    private Map<String, Roles> roles;
    private String avatarGroup;
    private boolean isActive;
}
