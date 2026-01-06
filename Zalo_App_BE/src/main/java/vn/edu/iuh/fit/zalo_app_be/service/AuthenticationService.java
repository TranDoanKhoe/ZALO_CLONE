

package vn.edu.iuh.fit.zalo_app_be.service;



import vn.edu.iuh.fit.zalo_app_be.controller.request.SignInRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.response.SignInResponse;

public interface AuthenticationService {
    SignInResponse getAccessToken(SignInRequest request);
    SignInResponse getRefreshToken(String refreshToken);
}
