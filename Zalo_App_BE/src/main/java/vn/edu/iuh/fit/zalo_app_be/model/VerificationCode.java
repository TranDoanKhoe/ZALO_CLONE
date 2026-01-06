
package vn.edu.iuh.fit.zalo_app_be.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter
@Setter
@Document(collection = "verification_codes")
public class VerificationCode {
    @Id
    private String id;
    private String code;
    private String email;
    private LocalDateTime expiryDate;
    private boolean used;

    public VerificationCode(String code, String email, LocalDateTime expiryDate) {
        this.code = code;
        this.email = email;
        this.expiryDate = expiryDate;
        this.used = false;
    }
}
