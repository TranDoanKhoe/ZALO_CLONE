

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
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getName() == null) {
                log.error("No authentication found");
                return ResponseEntity.status(401).body(List.of(Map.of("message", "Unauthorized")));
            }

            String senderId = userRepository.findByUsername(authentication.getName()).getId();

            if (senderId == null) {
                log.error("User not found for username: {}", authentication.getName());
                return ResponseEntity.status(401).body(List.of(Map.of("message", "User not found")));
            }

            log.info("Uploading files: senderId={}, groupId={}, receiverId={}, filesCount={}", 
                senderId, groupId, receiverId, files != null ? files.size() : 0);

            if (files == null || files.isEmpty()) {
                log.warn("No files to upload");
                return ResponseEntity.badRequest().body(List.of(Map.of("message", "No files to upload")));
            }

            List<Map<String, String>> fileResults = new ArrayList<>();
            for (MultipartFile file : files) {
                try {
                    log.info("Processing file: name={}, size={}, type={}", 
                        file.getOriginalFilename(), file.getSize(), file.getContentType());
                    
                    MessageRequest request = new MessageRequest();
                    request.setSenderId(senderId);
                    request.setReceiverId(receiverId);
                    request.setGroupId(groupId);
                    request.setReplyToMessageId(replyToMessageId);
                    
                    Map<String, String> result = messageService.uploadFile(file, request);
                    fileResults.add(result);
                    log.info("File uploaded successfully: {}", result);
                } catch (Exception e) {
                    log.error("Error uploading file {}: {}", file.getOriginalFilename(), e.getMessage(), e);
                    fileResults.add(Map.of(
                        "error", "Failed to upload " + file.getOriginalFilename(),
                        "message", e.getMessage()
                    ));
                }
            }

            log.info("All files processed. Success count: {}", fileResults.size());

            // Send via WebSocket
            try {
                if (groupId != null) {
                    webSocketService.sendMessageToGroup(groupId, fileResults);
                } else {
                    // Send to both sender and receiver
                    webSocketService.sendMessageToUser(receiverId, fileResults);
                    webSocketService.sendMessageToUser(senderId, fileResults);
                }
            } catch (Exception e) {
                log.error("Error sending via WebSocket: {}", e.getMessage());
                // Continue anyway as files are uploaded
            }

            return ResponseEntity.ok(fileResults);
        } catch (Exception e) {
            log.error("Unexpected error in uploadFile: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                List.of(Map.of("message", "Server error: " + e.getMessage()))
            );
        }
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
