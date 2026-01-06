
package vn.edu.iuh.fit.zalo_app_be.service;



import vn.edu.iuh.fit.zalo_app_be.controller.response.FriendResponse;
import vn.edu.iuh.fit.zalo_app_be.model.Friend;

import java.util.List;

public interface FriendService {
    List<Friend> getPendingFriendRequests();

    List<FriendResponse> getAllFriends();

    FriendResponse getFriendById(String friendId);

    void sendFriendRequest(String phone);

    void acceptFriendRequest(String requestId);

    void cancelFriendRequest(String receiverId);

    void deleteFriend(String friendId);

    void blockUser(String blockedUserId);

    void unblockUser(String blockedUserId);
}
