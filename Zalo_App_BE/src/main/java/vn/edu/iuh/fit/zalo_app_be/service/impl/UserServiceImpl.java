

package vn.edu.iuh.fit.zalo_app_be.service.impl;


import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.iuh.fit.zalo_app_be.common.TokenType;
import vn.edu.iuh.fit.zalo_app_be.common.UserActiveStatus;
import vn.edu.iuh.fit.zalo_app_be.common.UserStatus;
import vn.edu.iuh.fit.zalo_app_be.controller.request.UserPasswordRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.request.UserRegisterRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.request.UserUpdateRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.request.VerifyEmailRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.response.*;
import vn.edu.iuh.fit.zalo_app_be.exception.DulicatedUserException;
import vn.edu.iuh.fit.zalo_app_be.exception.InvalidDataException;
import vn.edu.iuh.fit.zalo_app_be.exception.UnauthorizedException;
import vn.edu.iuh.fit.zalo_app_be.model.VerificationCode;
import vn.edu.iuh.fit.zalo_app_be.model.User;
import vn.edu.iuh.fit.zalo_app_be.repository.VerificationCodeRepository;
import vn.edu.iuh.fit.zalo_app_be.repository.UserRepository;
import vn.edu.iuh.fit.zalo_app_be.service.EmailService;
import vn.edu.iuh.fit.zalo_app_be.service.JwtService;
import vn.edu.iuh.fit.zalo_app_be.service.UserService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j(topic = "USER-SERVICE")
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final VerificationCodeRepository passwordResetTokenRepository;
    private final Cloudinary cloudinary;
    private final RandomCodeGenerator randomCodeGenerator;

    @Value("${avatar.default}")
    private String avatarDefault;

    @Value("${spring.mail.reset-code-expiry-minutes}")
    private int resetCodeExpiryMinutes;

    @Override
    public RegisterResponse register(UserRegisterRequest request) {
        User user = userRepository.findByUsername(request.getUsername());

        if (user != null) {
            throw new DulicatedUserException("User already exists");
        }

        User userByUsername = userRepository.findByUsername(request.getUsername());
        if (userByUsername != null) {
            log.error("Username already exists");
            throw new DulicatedUserException("Username already exists");
        }

        User userByPhone = userRepository.findByPhone(request.getPhone());
        if (userByPhone != null) {
            log.error("Phone number already exists");
            throw new DulicatedUserException("Phone number already exists");
        }


        user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .phone(request.getPhone())
                .avatar(avatarDefault)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .birthday(request.getBirthday())
                .gender(request.getGender())
                .status(UserStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getUsername());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getUsername());

        return RegisterResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatar(user.getAvatar())
                .status(UserStatus.ACTIVE)
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .birthday(user.getBirthday())
                .gender(user.getGender())
                .accessToken(accessToken)
                .refreshToken(refreshToken).build();
    }

    @Override
    public UserUpdateResponse updateUser(UserUpdateRequest request, MultipartFile file) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() instanceof String) {
            log.error("No authenticated user found");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        String username = authentication.getName();

        User user = userRepository.findByUsername(username);
        if (user == null) {
            log.error("User not found with username: {}", username);
            throw new UsernameNotFoundException("User not found");
        }

        log.info("User loaded from DB with username: {} - id: {} ", user.getUsername(), user.getId());

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setEmail(request.getEmail());
        user.setGender(request.getGender());
        user.setBirthday(request.getBirthday());

        if (file != null && !file.isEmpty()) {
            if (file.getSize() > 10 * 1024 * 1024) {
                log.error("File size exceeds limit");
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File size exceeds limit");
            }

            String contentType = file.getContentType();
            if (contentType == null || (!contentType.startsWith("image/"))) {
                log.error("Invalid file type");
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file type");
            }

            try {
                Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("resource_type", "image", "folder", "user_avatars"));
                String avatarUrl = (String) uploadResult.get("secure_url");
                user.setAvatar(avatarUrl);
                log.info("Avatar uploaded to Cloudinary: {} for user: {}", avatarUrl, user.getId());
            } catch (Exception e) {
                log.error("Error uploading avatar to Cloudinary: {}", e.getMessage());
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload avatar");
            }
        }

        log.info("User {} updated", user.getId());
        user = userRepository.save(user);

        return UserUpdateResponse.builder().firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .gender(user.getGender())
                .birthday(user.getBirthday())
                .avatar(user.getAvatar())
                .status(user.getStatus())
                .username(user.getUsername())
                .createdAt(user.getCreatedAt())
                .updateAt(user.getUpdateAt())
                .build();
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
        return user;
    }

    @Override
    public UserPasswordResponse updatePassword(UserPasswordRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found");
        }

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Password changed successfully for user: {}", username);

        return UserPasswordResponse.builder().message("Password changed successfully").build();
    }

    @Override
    public UserResponse getUserCurrent() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() instanceof String) {
            log.error("No authenticated user found");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        User user = (User) authentication.getPrincipal();

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .birthday(user.getBirthday())
                .email(user.getEmail())
                .phone(user.getPhone())
                .gender(user.getGender())
                .status(user.getStatus())
                .avatar(user.getAvatar())
                .createdAt(user.getCreatedAt())
                .updateAt(user.getUpdateAt())
                .build();
    }

    @Override
    public LogoutResponse logoutUserCurrent(String token) {
        log.info("Logging out user with token: {}", token);
        String username;
        try {
            username = jwtService.extractUsername(token, TokenType.ACCESS_TOKEN);
        } catch (IllegalArgumentException e) {
            log.error("Invalid access token format: {}", e.getMessage());
            throw new UnauthorizedException(HttpStatus.UNAUTHORIZED, "Invalid access token format: " + e.getMessage());
        } catch (RuntimeException e) {
            log.error("Error extracting username from token: {}", e.getMessage());
            throw new UnauthorizedException(HttpStatus.UNAUTHORIZED, e.getMessage());
        }

        User user = userRepository.findByUsername(username);
        if (user == null) {
            log.error("Token is invalid or expired");
            throw new UnauthorizedException(HttpStatus.UNAUTHORIZED, "Token is invalid or expired");
        }

        jwtService.blackListToken(token, TokenType.ACCESS_TOKEN);
        user.setActiveStatus(UserActiveStatus.OFFLINE);
        userRepository.save(user);
        log.info("User {} logged out successfully", user.getUsername());

        log.info("Token blacklisted successfully for user: {}", username);
        return LogoutResponse.builder().message("Logout successfully").build();
    }

    @Override
    public void requestPasswordReset(String email) {
        log.info("Requesting password reset for email: {}", email);

        User user = userRepository.findByEmail(email);
        if (user == null) {
            log.error("User not found with email: {}", email);
            throw new InvalidDataException("User not found");
        }
        VerificationCode tokenReset = passwordResetTokenRepository.findByEmail(user.getEmail());
        if (tokenReset != null) {
            passwordResetTokenRepository.delete(tokenReset);
        }

        String code = randomCodeGenerator.generateCode();
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(10);
        VerificationCode resetToken = new VerificationCode(code, email, expiryDate);
        passwordResetTokenRepository.save(resetToken);

        try {
            emailService.sendPasswordResetEmail(email, code);
        } catch (Exception e) {
            log.error("Error while sending password reset email: {}", e.getMessage());
            passwordResetTokenRepository.delete(resetToken);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error while sending password reset email");
        }
    }

    @Override
    public void resetPassword(String code, String newPassword) {
        log.info("Resetting password with code: {}", code);

        if (code == null || code.trim().isEmpty()) {
            log.error("Code is null");
            throw new UnauthorizedException(HttpStatus.UNAUTHORIZED, "Invalid reset token");
        }

        VerificationCode resetToken = passwordResetTokenRepository.findByCode(code);

        if (resetToken == null) {
            log.error("Reset token is null or empty");
            throw new UnauthorizedException(HttpStatus.UNAUTHORIZED, "Invalid reset token");
        }

        User user = userRepository.findByEmail(resetToken.getEmail());

        if (user == null) {
            log.error("User not found with email: {}", resetToken.getEmail());
            throw new InvalidDataException("User not found");
        }

        if (resetToken.isUsed()) {
            log.error("Reset token already used: {}", code);
            throw new UnauthorizedException(HttpStatus.UNAUTHORIZED, "Reset token already used");
        }

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            log.error("Reset token expired: {}", code);
            throw new UnauthorizedException(HttpStatus.UNAUTHORIZED, "Reset token expired");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Password reset successfully for user: {}", user.getUsername());
    }

    @Override
    public List<UserResponse> findUsersByIds(List<String> ids) {
        List<User> users = userRepository.findAllById(ids);
        return users.stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getBirthday(),
                        user.getEmail(),
                        user.getPhone(),
                        user.getGender(),
                        user.getStatus(),
                        user.getAvatar(),
                        user.getCreatedAt(),
                        user.getUpdateAt()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public void sendVerificationEmail(String email) {
        VerificationCode tokenReset = passwordResetTokenRepository.findByEmail(email);
        if (tokenReset != null) {
            passwordResetTokenRepository.delete(tokenReset);
        }

        String code = randomCodeGenerator.generateCode();
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(10);
        VerificationCode resetToken = new VerificationCode(code, email, expiryDate);
        passwordResetTokenRepository.save(resetToken);

        try {
            emailService.sendVerificationEmail(email, code);
        } catch (Exception e) {
            log.error("Error while sending password reset email: {}", e.getMessage());
            passwordResetTokenRepository.delete(resetToken);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error while sending password reset email");
        }

    }

    @Override
    public RegisterResponse verifyEmail(VerifyEmailRequest request) {
        log.info("Verification Email with code: {}", request.getCode());

        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            log.error("Code is null");
            throw new UnauthorizedException(HttpStatus.UNAUTHORIZED, "Invalid Code");
        }

        VerificationCode codeVerification = passwordResetTokenRepository.findByCode(request.getCode());

        validateCode(codeVerification);

        User user = userRepository.findByUsername(request.getUserRegisterRequest().getUsername());
        if (user != null) {
            throw new DulicatedUserException("User already exists");
        }

        user = User.builder()
                .username(request.getUserRegisterRequest().getUsername())
                .password(passwordEncoder.encode(request.getUserRegisterRequest().getPassword()))
                .email(request.getUserRegisterRequest().getEmail())
                .phone(request.getUserRegisterRequest().getPhone())
                .avatar(avatarDefault)
                .firstName(request.getUserRegisterRequest().getFirstName())
                .lastName(request.getUserRegisterRequest().getLastName())
                .birthday(request.getUserRegisterRequest().getBirthday())
                .gender(request.getUserRegisterRequest().getGender())
                .status(UserStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getUsername());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getUsername());

        return RegisterResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatar(user.getAvatar())
                .status(UserStatus.ACTIVE)
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .birthday(user.getBirthday())
                .gender(user.getGender())
                .activeStatus(UserActiveStatus.OFFLINE)
                .accessToken(accessToken)
                .refreshToken(refreshToken).build();
    }

    @Override
    public UserInfoResponse getUserByPhone(String phone) {
        User user = userRepository.findByPhone(phone);
        if(user == null){
            log.error("User not found with phone: {}", phone);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        return UserInfoResponse.builder()
                .id(user.getId())
                .name(user.getFirstName() + " " + user.getLastName())
                .phone(user.getPhone())
                .avatar(user.getAvatar())
                .build();
    }

    private void validateCode(VerificationCode code) {
        if (code.isUsed()) {
            log.error("Code already used: {}", code);
            throw new UnauthorizedException(HttpStatus.UNAUTHORIZED, "Code already used");
        }

        if (code.getExpiryDate().isBefore(LocalDateTime.now())) {
            log.error("Code expired: {}", code);
            throw new UnauthorizedException(HttpStatus.UNAUTHORIZED, "Code expired");
        }
    }
}
