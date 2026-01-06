

package vn.edu.iuh.fit.zalo_app_be.model;

import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import vn.edu.iuh.fit.zalo_app_be.common.Gender;
import vn.edu.iuh.fit.zalo_app_be.common.UserActiveStatus;
import vn.edu.iuh.fit.zalo_app_be.common.UserStatus;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
@Slf4j(topic = "USER-ENTITY")
public class User implements UserDetails, Serializable {
    @Id
    private String id;

    private String firstName;

    private String lastName;

    private Date birthday;

    private String email;

    private String phone;

    private Gender gender;

    private UserStatus status;

    private String avatar;

    private String username;

    private String password;

    private List<String> friends = new ArrayList<>();

    private List<String> blocks = new ArrayList<>();

    private UserActiveStatus activeStatus;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updateAt;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList();
    }

     @Override
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return UserDetails.super.isAccountNonLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    @Override
    public boolean isEnabled() {
        return UserStatus.ACTIVE.equals(status);
    }
}
