

package vn.edu.iuh.fit.zalo_app_be.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import vn.edu.iuh.fit.zalo_app_be.common.UserActiveStatus;
import vn.edu.iuh.fit.zalo_app_be.controller.request.SignInRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.response.SignInResponse;
import vn.edu.iuh.fit.zalo_app_be.exception.InvalidDataException;
import vn.edu.iuh.fit.zalo_app_be.model.User;
import vn.edu.iuh.fit.zalo_app_be.repository.UserRepository;
import vn.edu.iuh.fit.zalo_app_be.service.AuthenticationService;
import vn.edu.iuh.fit.zalo_app_be.service.JwtService;

import static vn.edu.iuh.fit.zalo_app_be.common.TokenType.REFRESH_TOKEN;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "AUTHENTICATION-SERVICE")
public class AuthenticationServiceImpl implements AuthenticationService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    public SignInResponse getAccessToken(SignInRequest request) {
        log.info("Get Access Token");

        User user;
        try {
            log.info("Username: {}, Password: {}", request.getUsername(), request.getPassword());
            Authentication authenticate = authenticationManager
                    .authenticate(new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

            log.info("isAuthenticated: {}", authenticate.isAuthenticated());

            SecurityContextHolder.getContext().setAuthentication(authenticate);

            user = (User) authenticate.getPrincipal();
            String accessToken = jwtService.generateAccessToken(user.getId(), request.getUsername());
            String refreshToken = jwtService.generateRefreshToken(user.getId(), request.getUsername());

            log.info("accessToken: {}", accessToken);
            log.info("refreshToken: {}", refreshToken);

            return SignInResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .userId(user.getId())
                    .username(user.getUsername())
                    .activeStatus(UserActiveStatus.ONLINE)
                    .build();

        } catch (BadCredentialsException e) {
            log.error("Invalid credentials: {}", e.getMessage());
            throw new AccessDeniedException("Invalid username or password");
        } catch (DisabledException e) {
            log.error("Account disabled: {}", e.getMessage());
            throw new AccessDeniedException("Account is disabled");
        } catch (Exception e) {
            log.error("Unexpected error during login: {}", e.getMessage());
            throw new AccessDeniedException("Login failed");
        }
    }

    @Override
    public SignInResponse getRefreshToken(String refreshToken) {
        log.info("Get Refresh Token");

        if (!StringUtils.hasLength(refreshToken)) {
            throw new InvalidDataException("Token must be not blank");
        }

        try {
            String username = jwtService.extractUsername(refreshToken, REFRESH_TOKEN);

            User user = userRepository.findByUsername(username);

            String accessToken = jwtService.generateAccessToken(user.getId(), user.getUsername());

            return SignInResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .userId(user.getId())
                    .username(user.getUsername())
                    .activeStatus(UserActiveStatus.ONLINE)
                    .build();
        } catch (Exception e) {
            log.error("Refresh token failed, message: {} ", e.getMessage());
            throw new AccessDeniedException(e.getMessage());
        }

    }
}
