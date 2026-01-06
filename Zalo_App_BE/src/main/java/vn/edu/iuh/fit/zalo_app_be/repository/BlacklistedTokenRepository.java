
package vn.edu.iuh.fit.zalo_app_be.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import vn.edu.iuh.fit.zalo_app_be.model.BlacklistedToken;


@Repository
public interface BlacklistedTokenRepository extends MongoRepository<BlacklistedToken, String> {
    boolean existsByToken(String token);
}
