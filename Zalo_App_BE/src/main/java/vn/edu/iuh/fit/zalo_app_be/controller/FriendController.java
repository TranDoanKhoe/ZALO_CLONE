
package vn.edu.iuh.fit.zalo_app_be.controller;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.zalo_app_be.controller.response.FriendResponse;
import vn.edu.iuh.fit.zalo_app_be.model.Friend;
import vn.edu.iuh.fit.zalo_app_be.service.FriendService;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/friend")
@Slf4j(topic = "FRIEND-CONTROLLER")
public class FriendController {
    private final FriendService friendService;

    @PostMapping("/send-request/{phone}")
    @Operation(summary = "Send friend request", description = "Send a friend request to another user")
    public ResponseEntity<Map<String, String>> sendFriendRequest(@PathVariable String phone) {
        log.info("Sending friend request to {}", phone);
        if (phone == null || phone.isEmpty()) {
            log.info("phone is null or empty");
            return ResponseEntity.badRequest().body(Map.of("message", "phone cannot be null or empty"));
        }
        friendService.sendFriendRequest(phone);
        return ResponseEntity.ok(Map.of("message", "Friend request sent"));
    }

    @GetMapping("/requests/pending")
    @Operation(summary = "Get pending friend requests", description = "Retrieve all pending friend requests for the current user")
    public ResponseEntity<List<Friend>> getPendingFriendRequests() {
        log.info("Fetching pending friend requests");
        return ResponseEntity.status(HttpStatus.OK).body(friendService.getPendingFriendRequests());
    }

    @GetMapping
    @Operation(summary = "Get friends list", description = "Retrieve the list of friends for the current user")
    public ResponseEntity<List<FriendResponse>> getFriends() {
        log.info("Fetching friends list");
        return ResponseEntity.status(HttpStatus.OK).body(friendService.getAllFriends());
    }

    @PostMapping("/request/{requestId}/accept")
    @Operation(summary = "Accept friend request", description = "Accept a friend request")
    public ResponseEntity<Map<String, String>> acceptFriendRequest(@PathVariable String requestId) {
        log.info("Accepting friend request with ID {}", requestId);
        friendService.acceptFriendRequest(requestId);
        return ResponseEntity.ok(Map.of("message", "Friend request accepted"));
    }

    @PostMapping("/request/{requestId}/cancel")
    @Operation(summary = "Cancel friend request", description = "Cancel a sent friend request")
    public ResponseEntity<Map<String, String>> cancelFriendRequest(@PathVariable String requestId) {
        log.info("Canceling friend request with ID {}", requestId);
        friendService.cancelFriendRequest(requestId);
        return ResponseEntity.ok(Map.of("message", "Friend request canceled"));
    }

    @DeleteMapping("/{friendId}")
    @Operation(summary = "Delete friend", description = "Delete a friend from the friends list")
    public ResponseEntity<Map<String, String>> deleteFriend(@PathVariable String friendId) {
        log.info("Deleting friend with ID {}", friendId);
        friendService.deleteFriend(friendId);
        return ResponseEntity.ok(Map.of("message", "Friend deleted"));
    }

    @PostMapping("/block/{blockedUserId}")
    @Operation(summary = "Block user", description = "Block a user")
    public ResponseEntity<Map<String, String>> blockUser(@PathVariable String blockedUserId) {
        log.info("Blocking user with ID {}", blockedUserId);
        friendService.blockUser(blockedUserId);
        return ResponseEntity.ok(Map.of("message", "User blocked"));
    }

    @PostMapping("/unblock/{blockedUserId}")
    @Operation(summary = "Unblock user", description = "Unblock a user")
    public ResponseEntity<Map<String, String>> unblockUser(@PathVariable String blockedUserId) {
        log.info("Unblocking user with ID {}", blockedUserId);
        friendService.unblockUser(blockedUserId);
        return ResponseEntity.ok(Map.of("message", "User unblocked"));
    }

    @GetMapping("/{friendId}")
    @Operation(summary = "Get friend by ID", description = "Retrieve a friend's details by their ID")
    public ResponseEntity<FriendResponse> getFriendById(@PathVariable String friendId) {
        log.info("Fetching friend with ID {}", friendId);
        FriendResponse friend = friendService.getFriendById(friendId);
        return ResponseEntity.ok(friend);
    }
}
