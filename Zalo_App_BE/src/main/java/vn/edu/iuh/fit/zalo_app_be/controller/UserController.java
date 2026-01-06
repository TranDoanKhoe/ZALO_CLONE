

package vn.edu.iuh.fit.zalo_app_be.controller;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.iuh.fit.zalo_app_be.controller.request.UserPasswordRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.request.UserUpdateRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.response.*;
import vn.edu.iuh.fit.zalo_app_be.service.UserService;

@RestController
@Slf4j(topic = "USER-CONTROLLER")
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
    private final UserService userService;

    @GetMapping("/get-info-for-user")
    public UserResponse getUserFromUsername() {
        log.info("Get user info request");

        return userService.getUserCurrent();
    }

    @PutMapping(value = "/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserUpdateResponse updateUser(@RequestPart(value = "request") UserUpdateRequest request,
                                         @RequestPart(value = "avatar", required = false) MultipartFile file) {
        log.info("Update user request: {}", request.getEmail());

        return userService.updateUser(request, file);
    }

    @PostMapping("/change-password")
    public UserPasswordResponse changePassword(@RequestBody UserPasswordRequest request) {
        log.info("Change password request: {}", request);

        return userService.updatePassword(request);
    }

    @PostMapping("/logout")
    public LogoutResponse logoutUserCurrent(@RequestHeader("Authorization") String token) {
        log.info("Logout user request: {}", token);

        if (token == null || !token.startsWith("Bearer ")) {
            log.error("Invalid Authorization header format");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Authorization header format");
        }

        String accessToken = token.substring(7).trim();
        if (accessToken.isEmpty()) {
            log.error("Access token is empty");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Access token is empty");
        }

        return userService.logoutUserCurrent(accessToken);
    }

    @GetMapping("/get-user-by-phone/{phone}")
    public UserInfoResponse getUserByPhone(@PathVariable String phone) {
        log.info("Get user by phone request: {}", phone);
        String normalizedPhone = phone.startsWith("0") ? phone : "0" + phone;

        return userService.getUserByPhone(normalizedPhone);
    }
}
