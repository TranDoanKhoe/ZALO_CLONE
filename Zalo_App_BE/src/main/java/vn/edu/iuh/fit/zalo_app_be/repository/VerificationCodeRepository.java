

package vn.edu.iuh.fit.zalo_app_be.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import vn.edu.iuh.fit.zalo_app_be.model.VerificationCode;



@Repository
public interface VerificationCodeRepository extends MongoRepository<VerificationCode, String> {
    VerificationCode findByEmail(String email);

    VerificationCode findByCode(String code);
}
