
package vn.edu.iuh.fit.zalo_app_be.service;


import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.zalo_app_be.repository.UserRepository;

@Service
public record UserServiceDetail(UserRepository userRepository) {
    public UserDetailsService userDetailsService() {
        return userRepository::findByUsername;
    }
}
