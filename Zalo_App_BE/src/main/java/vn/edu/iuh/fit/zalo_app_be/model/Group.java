
package vn.edu.iuh.fit.zalo_app_be.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import vn.edu.iuh.fit.zalo_app_be.common.Roles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Group {
    @Id
    private String id;
    private String name;
    private String createId;
    private List<String> memberIds;
    private Map<String, Roles> roles; // userId : role (admin : member)
    private String avatarGroup;
    @CreatedDate
    @Indexed
    private LocalDateTime createAt;
    @LastModifiedDate
    @Indexed
    private LocalDateTime updateAt;
    private boolean isActive;
}
