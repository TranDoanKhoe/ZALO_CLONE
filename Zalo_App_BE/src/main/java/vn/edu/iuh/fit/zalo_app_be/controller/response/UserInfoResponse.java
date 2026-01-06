package vn.edu.iuh.fit.zalo_app_be.controller.response;


import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class UserInfoResponse {
    private String id;
    private String name;
    private String avatar;
    private String phone;
}
