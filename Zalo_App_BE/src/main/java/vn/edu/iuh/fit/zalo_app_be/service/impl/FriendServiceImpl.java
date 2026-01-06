

package vn.edu.iuh.fit.zalo_app_be.service.impl;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.iuh.fit.zalo_app_be.common.FriendStatus;
import vn.edu.iuh.fit.zalo_app_be.controller.response.FriendResponse;
import vn.edu.iuh.fit.zalo_app_be.exception.ResourceNotFoundException;
import vn.edu.iuh.fit.zalo_app_be.model.Friend;
import vn.edu.iuh.fit.zalo_app_be.model.User;
import vn.edu.iuh.fit.zalo_app_be.repository.FriendRepository;
import vn.edu.iuh.fit.zalo_app_be.repository.UserRepository;
import vn.edu.iuh.fit.zalo_app_be.service.FriendService;
import vn.edu.iuh.fit.zalo_app_be.service.WebSocketService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "FRIEND-SERVICE")
public class FriendServiceImpl implements FriendService {
    private final UserRepository userRepository;
    private final FriendRepository friendRepository;
    private final WebSocketService webSocketService;

    @Override
    public List<Friend> getPendingFriendRequests() {
        String userId = getCurrentUserId();

        return friendRepository.findByReceiverIdAndStatus(userId, FriendStatus.PENDING);
    }

    @Override
    public List<FriendResponse> getAllFriends() {
        String userId = getCurrentUserId();

        Optional<User> userOptional = userRepository.findById(userId);

        // Check if the user is not found
        throwIf(userOptional.isEmpty(), "User not found with id: {}", "User not found with id: " + userId, HttpStatus.NOT_FOUND);

        List<String> friendIds = userOptional.get().getFriends();

        // Check if the user has no friends
        throwIf(friendIds == null && friendIds.isEmpty(), "User has no friends", "User has no friends", HttpStatus.NOT_FOUND);

        List<User> friends = userRepository.getAllByFriends(friendIds);
        log.info("Found {} friends for user {}", friends.size(), userId);

        // Map the friends to FriendResponse
        List<FriendResponse> friendResponses = friends.stream()
                .map(friend -> FriendResponse.builder()
                        .id(friend.getId())
                        .name(friend.getFirstName() + " " + friend.getLastName())
                        .avatar(friend.getAvatar())
                        .phone(friend.getPhone())
                        .activeStatus(friend.getActiveStatus())
                        .build())
                .toList();
        log.info("Returning {} friends for user {}", friendResponses.size(), userId);
        return friendResponses;
    }

    @Override
    public FriendResponse getFriendById(String friendId) {
        Optional<User> user = userRepository.findById(friendId);
        // Check if the friend is not found
        if (user.isEmpty()) {
            log.error("Friend not found with id: {}", friendId);
            throw new ResourceNotFoundException("Friend not found with id: " + friendId);
        }

        return FriendResponse.builder()
                .id(user.get().getId())
                .name(user.get().getFirstName() + " " + user.get().getLastName())
                .avatar(user.get().getAvatar())
                .phone(user.get().getPhone())
                .birthday(user.get().getBirthday())
                .gender(user.get().getGender())
                .activeStatus(user.get().getActiveStatus())
                .build();
    }

    @Override
    public void sendFriendRequest(String phone) {
        String senderId = getCurrentUserId();

        User receiverUser = userRepository.findByPhone(phone);

        String receiverId = receiverUser.getId();

        // Check if the sender and receiver are the same
        throwIf(senderId.equals(receiverId), "You cannot send a friend request to yourself", "You cannot send a friend request to yourself", HttpStatus.BAD_REQUEST);

        if (receiverId == null || receiverId.isEmpty()) {
            log.error("Receiver ID is null or empty");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receiver ID is null or empty");
        }
        // Check if the receiver exists
        Optional<User> receiver = userRepository.findById(receiverId);
        throwIf(receiver.isEmpty(), "Receiver not found with id: {}", "Receiver not found with id: " + phone, HttpStatus.NOT_FOUND);

        // Check if the receiver is sending request to sender
        Optional<Friend> existingFriendRequest = friendRepository.findBySenderIdAndReceiverIdAndStatus(senderId, phone, FriendStatus.PENDING);
        if (existingFriendRequest.isPresent()) {
            log.error("Friend request already sent from {} to {}", senderId, phone);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Friend request already sent");
        }

        // Check if the sender and receiver are already friends
        Optional<User> sender = userRepository.findById(senderId);
        throwIf(sender.get().getFriends().contains(receiverId), "You are already friends with this user", "You are already friends with this user", HttpStatus.BAD_REQUEST);

        //Check if the sender is blocked by the receiver
        throwIf(receiver.get().getBlocks().contains(senderId), "You are blocked by this user", "You are blocked by this user", HttpStatus.FORBIDDEN);

        // Create a new friend request
        Friend friendRequest = new Friend();
        friendRequest.setSenderId(senderId);
        friendRequest.setReceiverId(receiverId);
        friendRequest.setStatus(FriendStatus.PENDING);
        friendRequest.setCreatedAt(LocalDateTime.now());
        friendRequest.setUpdatedAt(LocalDateTime.now());

        friendRepository.save(friendRequest);

        log.info("Friend request sent to {} to {}", senderId, receiverId);

        webSocketService.notifyFriendRequest(senderId, receiverId);
    }

    @Override
    public void acceptFriendRequest(String requestId) {
        String userId = getCurrentUserId();
        Optional<Friend> friendRequest = friendRepository.findById(requestId);

        // Check if request is not found
        throwIf(friendRequest.isEmpty(), "Friend request not found with id: {}", "Friend request not found with id: " + requestId, HttpStatus.NOT_FOUND);

        // Check if the friend request is not pending
        throwIf(friendRequest.get().getStatus() != FriendStatus.PENDING, "Friend request is not pending", "Friend request is not pending", HttpStatus.BAD_REQUEST);

        // Update the friend request status to ACCEPTED
        friendRequest.get().setStatus(FriendStatus.ACCEPTED);
        friendRepository.save(friendRequest.get());

        // Add the sender and receiver to each other's friends list
        String senderId = friendRequest.get().getSenderId();
        String receiverId = friendRequest.get().getReceiverId();

        Optional<User> user = findUserById(senderId, "User not found with id: " + userId);
        Optional<User> friend = findUserById(receiverId, "Friend not found with id: " + receiverId);

        user.get().getFriends().add(receiverId);
        friend.get().getFriends().add(senderId);
        userRepository.save(user.get());
        userRepository.save(friend.get());

        webSocketService.notifyFriendRequestAccepted(user.get().getId(), friend.get().getId());

        log.info("Friend request accepted from {} to {}", userId, receiverId);
    }

    @Override
    public void cancelFriendRequest(String requestId) {
        Optional<Friend> friendRequest = friendRepository.findById(requestId);

        // Check if the friend request is not found
        throwIf(friendRequest.isEmpty(), "Friend request not found with id: {}", "Friend request not found with id: " + requestId, HttpStatus.NOT_FOUND);
        // Check if the friend request is not pending
        throwIf(friendRequest.get().getStatus() != FriendStatus.PENDING, "Friend request is not pending", "Friend request is not pending", HttpStatus.BAD_REQUEST);

        // Delete the friend request
        friendRepository.delete(friendRequest.get());
        webSocketService.notifyFriendRequestRejected(friendRequest.get().getSenderId(), friendRequest.get().getReceiverId());
        log.info("Friend request cancelled from {} to {}", friendRequest.get().getSenderId(), friendRequest.get().getReceiverId());
    }

    @Override
    public void deleteFriend(String friendId) {
        String userId = getCurrentUserId();
        Optional<User> user = findUserById(userId, "User not found with id: " + userId);
        Optional<User> friend = findUserById(friendId, "Friend not found with id: " + friendId);

        Optional<Friend> friendRequest = friendRepository.findBySenderIdAndReceiverIdAndStatus(userId, friendId, FriendStatus.ACCEPTED);
        // Check if the friend request is not found
        throwIf(friendRequest.isEmpty(), "Friend request not found with id: {}", "Friend request not found with id: " + friendId, HttpStatus.NOT_FOUND);
        // Check if the user and friend are not friends
        throwIf(!user.get().getFriends().contains(friendId), "User and friend are not friends", "User and friend are not friends", HttpStatus.BAD_REQUEST);

        user.get().getFriends().remove(friendId);
        friend.get().getFriends().remove(userId);

        userRepository.save(user.get());
        userRepository.save(friend.get());

        webSocketService.notifyFriendDeleted(user.get().getId(), friend.get().getId());
        log.info("Friend deleted from {} to {}", userId, friendId);
    }


    @Override
    public void blockUser(String blockedUserId) {
        String userId = getCurrentUserId();

        Optional<User> user = findUserById(userId, "User not found with id: " + userId);
        Optional<User> blockedUser = findUserById(blockedUserId, "Blocked user not found with id: " + blockedUserId);

        // Check if the user is already blocked
        throwIf(user.get().getBlocks().contains(blockedUserId), "User is already blocked", "User is already blocked", HttpStatus.BAD_REQUEST);

        if (user.get().getFriends().contains(blockedUserId)) {
            user.get().getFriends().remove(userId);
            blockedUser.get().getFriends().remove(blockedUserId);
            userRepository.save(blockedUser.get());
        }

        // Add the blocked user to the user's blocks list
        user.get().getBlocks().add(blockedUserId);

        userRepository.save(user.get());

        webSocketService.notifyUserBlocked(user.get().getId(), blockedUserId);
        log.info("User {} blocked user {}", userId, blockedUserId);
    }

    @Override
    public void unblockUser(String blockedUserId) {
        String userId = getCurrentUserId();
        Optional<User> user = findUserById(userId, "User not found with id: " + userId);
        Optional<User> blockedUser = findUserById(blockedUserId, "Blocked user not found with id: " + blockedUserId);

        // Check if the user is not blocked
        throwIf(!user.get().getBlocks().contains(blockedUserId), "User is not blocked", "User is not blocked", HttpStatus.BAD_REQUEST);

        // Remove the blocked user from the user's blocks list
        user.get().getBlocks().remove(blockedUserId);
        userRepository.save(user.get());

        webSocketService.notifyUserUnblocked(user.get().getId(), blockedUserId);
        log.info("User {} unblocked user {}", userId, blockedUserId);
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            log.error("User is not authenticated");
            throw new ResourceNotFoundException("User is not authenticated");
        }
        return ((User) authentication.getPrincipal()).getId();
    }

    private Optional<User> findUserById(String userId, String errorMessage) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            log.error(errorMessage);
            throw new ResourceNotFoundException(errorMessage);
        }
        return userOptional;
    }

    private void throwIf(boolean condition, String logMessage, String errorMessage, HttpStatus status) {
        if (condition) {
            log.error(logMessage);
            throw new ResponseStatusException(status, errorMessage);
        }
    }
}
