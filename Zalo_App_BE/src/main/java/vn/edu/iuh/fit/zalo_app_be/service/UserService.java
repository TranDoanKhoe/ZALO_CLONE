
package vn.edu.iuh.fit.zalo_app_be.service;


import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.iuh.fit.zalo_app_be.controller.request.UserPasswordRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.request.UserRegisterRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.request.UserUpdateRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.request.VerifyEmailRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.response.*;

import java.util.List;

public interface UserService {
    RegisterResponse register(UserRegisterRequest request);

    UserUpdateResponse updateUser(UserUpdateRequest request, MultipartFile file);

    UserDetails loadUserByUsername(String username);

    UserPasswordResponse updatePassword(UserPasswordRequest request);

    UserResponse getUserCurrent();

    LogoutResponse logoutUserCurrent(String token);

    void requestPasswordReset(String email);

    void resetPassword(String token, String newPassword);

    List<UserResponse> findUsersByIds(List<String> ids);

    void sendVerificationEmail(String email);

    RegisterResponse verifyEmail(VerifyEmailRequest request);

    UserInfoResponse getUserByPhone(String phone);

}
