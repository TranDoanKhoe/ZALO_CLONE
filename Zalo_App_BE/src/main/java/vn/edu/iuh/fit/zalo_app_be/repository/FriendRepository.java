
package vn.edu.iuh.fit.zalo_app_be.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import vn.edu.iuh.fit.zalo_app_be.common.FriendStatus;
import vn.edu.iuh.fit.zalo_app_be.model.Friend;

import java.util.List;
import java.util.Optional;



@Repository
public interface FriendRepository extends MongoRepository<Friend, String> {
    List<Friend> findByReceiverIdAndSenderId(String receiverId, String senderId, FriendStatus status);

    Optional<Friend> findBySenderIdAndReceiverIdAndStatus(String senderId, String receiverId, FriendStatus status);

    List<Friend> findByReceiverIdAndStatus(String receiverId,FriendStatus status);

    Optional<Friend> findBySenderId(String senderId);
}
