

package vn.edu.iuh.fit.zalo_app_be.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.iuh.fit.zalo_app_be.controller.request.MessageRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.response.MessageResponse;
import vn.edu.iuh.fit.zalo_app_be.repository.UserRepository;
import vn.edu.iuh.fit.zalo_app_be.service.MessageService;
import vn.edu.iuh.fit.zalo_app_be.service.WebSocketService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j(topic = "MESSAGE-CONTROLLER")
@RequestMapping("/message")
public class MessageController {
    private final MessageService messageService;
    private final UserRepository userRepository;
    private final WebSocketService webSocketService;

    @GetMapping("/chat-history/{userId}")
    public ResponseEntity<List<MessageResponse>> getChatHistory(@PathVariable String userId) {
        return ResponseEntity.ok(messageService.getChatHistory(userId));
    }

    @GetMapping("/chat-history/group/{groupId}")
    public ResponseEntity<List<MessageResponse>> getGroupChatHistory(@PathVariable String groupId) {
        return ResponseEntity.ok(messageService.getGroupChatHistory(groupId));
    }

    @PostMapping("/upload-file")
    public ResponseEntity<List<Map<String, String>>> uploadFile(
            @RequestParam("file") List<MultipartFile> files,
            @RequestParam(value = "receiverId", required = false) String receiverId,
            @RequestParam(value = "groupId", required = false) String groupId,
            @RequestParam(value = "replyToMessageId", required = false) String replyToMessageId
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String senderId = userRepository.findByUsername(authentication.getName()).getId();

        if (senderId == null) {
            return ResponseEntity.status(401).build();
        }

        log.debug("Uploading files: senderId={}, groupId={}, receiverId={}", senderId, groupId, receiverId);

        if (files == null || files.isEmpty()) {
            log.info("No files to upload");
            return ResponseEntity.badRequest().body(List.of(Map.of("message", "No files to upload")));
        }

        List<Map<String, String>> fileResults = new ArrayList<>();
        for (MultipartFile file : files) {
            MessageRequest request = new MessageRequest();
            request.setSenderId(senderId);
            request.setReceiverId(receiverId);
            request.setGroupId(groupId);
            request.setReplyToMessageId(replyToMessageId);
            fileResults.add(messageService.uploadFile(file, request));
        }
        log.info("Uploaded files: {}", fileResults);

        if (groupId != null) {
            webSocketService.sendMessageToGroup(groupId, fileResults);
        } else {
            // Send to both sender and receiver
            webSocketService.sendMessageToUser(receiverId, fileResults);
            webSocketService.sendMessageToUser(senderId, fileResults);
        }

        return new ResponseEntity<>(fileResults, HttpStatus.OK);
    }

    @GetMapping("/all-pinned-messages")
    public List<MessageResponse> getPinnedMessages(
            @RequestParam String otherUserId,
            @RequestParam(required = false) String groupId
    ) {
        log.debug("Getting pinned messages: otherUserId={}, groupId={}", otherUserId, groupId);

        try {
            return messageService.getPinnedMessages(otherUserId, groupId);
        } catch (Exception e) {
            log.error("Error getting pinned messages: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error getting pinned messages");
        }
    }

    @GetMapping("/search")
    public List<MessageResponse> searchMessages(
            @RequestParam String otherUserId,
            @RequestParam(required = false) String groupId,
            @RequestParam String keyword
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = userRepository.findByUsername(authentication.getName()).getId();
        log.debug("Searching messages: userId={}, otherUserId={}, groupId={}, keyword={}", userId, otherUserId, groupId, keyword);

        try {
            return messageService.searchMessages(userId, otherUserId, groupId, keyword);
        } catch (Exception e) {
            log.error("Error searching messages: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error searching messages");
        }
    }
}
