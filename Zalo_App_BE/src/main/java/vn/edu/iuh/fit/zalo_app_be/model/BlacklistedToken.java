
package vn.edu.iuh.fit.zalo_app_be.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@Document(collection = "blacklisted_tokens")
public class BlacklistedToken {
    @Id
    private String id;

    private String token;

    private LocalDateTime expiryDate;

    @CreatedDate
    private LocalDateTime  createAt;

    @LastModifiedDate
    private LocalDateTime updateAt;

    public BlacklistedToken(String token, LocalDateTime expiryDate) {
        this.token = token;
        this.expiryDate = expiryDate;
    }
}
