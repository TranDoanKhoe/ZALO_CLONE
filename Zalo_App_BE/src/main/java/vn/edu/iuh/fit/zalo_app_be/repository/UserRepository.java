
package vn.edu.iuh.fit.zalo_app_be.repository;


import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import vn.edu.iuh.fit.zalo_app_be.controller.response.UserResponse;
import vn.edu.iuh.fit.zalo_app_be.model.Friend;
import vn.edu.iuh.fit.zalo_app_be.model.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    User findByUsername(String username);

    User findByEmail(String email);

    @Query("{ '_id': { $in: ?0 } }")
    List<User> getAllByFriends(List<String> friendIds);

    User findByPhone(String phone);
}
