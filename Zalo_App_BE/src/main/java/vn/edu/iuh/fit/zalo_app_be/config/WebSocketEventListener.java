package vn.edu.iuh.fit.zalo_app_be.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import vn.edu.iuh.fit.zalo_app_be.common.UserActiveStatus;
import vn.edu.iuh.fit.zalo_app_be.model.User;
import vn.edu.iuh.fit.zalo_app_be.repository.UserRepository;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j(topic = "WEBSOCKET-EVENT-LISTENER")
public class WebSocketEventListener {
    
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        // Lấy userId từ header thay vì Principal
        String userId = headerAccessor.getFirstNativeHeader("userId");
        
        log.info("WebSocket CONNECT event received. UserId from header: {}", userId);
        
        if (userId != null && !userId.isEmpty()) {
            log.info("User connected with ID: {}", userId);
            
            // Lưu userId vào session attributes để dùng khi disconnect
            if (headerAccessor.getSessionAttributes() != null) {
                headerAccessor.getSessionAttributes().put("userId", userId);
            }
            
            // Tìm user theo ID
            Optional<User> userOptional = userRepository.findById(userId);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                user.setActiveStatus(UserActiveStatus.ONLINE);
                userRepository.save(user);
                
                // Broadcast status change tới tất cả friends
                broadcastStatusChange(user.getId(), UserActiveStatus.ONLINE, user.getFriends());
                log.info("User {} ({}) is now ONLINE, broadcasted to {} friends", 
                    user.getUsername(), userId, user.getFriends() != null ? user.getFriends().size() : 0);
            } else {
                log.warn("User not found in database with ID: {}", userId);
            }
        } else {
            log.warn("UserId header is missing in connect event");
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        // Lấy userId từ session attributes (đã lưu khi connect)
        String userId = (String) headerAccessor.getSessionAttributes().get("userId");
        
        log.info("WebSocket DISCONNECT event received. UserId: {}", userId);
        
        if (userId != null && !userId.isEmpty()) {
            log.info("User disconnected with ID: {}", userId);
            
            // Tìm user theo ID
            Optional<User> userOptional = userRepository.findById(userId);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                user.setActiveStatus(UserActiveStatus.OFFLINE);
                userRepository.save(user);
                
                // Broadcast status change tới tất cả friends
                broadcastStatusChange(user.getId(), UserActiveStatus.OFFLINE, user.getFriends());
                log.info("User {} ({}) is now OFFLINE, broadcasted to {} friends", 
                    user.getUsername(), userId, user.getFriends() != null ? user.getFriends().size() : 0);
            } else {
                log.warn("User not found in database with ID: {}", userId);
            }
        } else {
            log.warn("UserId not found in session attributes during disconnect");
        }
    }

    private void broadcastStatusChange(String userId, UserActiveStatus status, List<String> friendIds) {
        if (friendIds == null || friendIds.isEmpty()) {
            return;
        }
        
        Map<String, Object> statusChangeMessage = new HashMap<>();
        statusChangeMessage.put("userId", userId);
        statusChangeMessage.put("status", status.name().toLowerCase());
        
        // Gửi thông báo tới tất cả friends qua endpoint /queue/status
        for (String friendId : friendIds) {
            try {
                messagingTemplate.convertAndSendToUser(friendId, "/queue/status", statusChangeMessage);
                log.debug("Sent status change notification to friend: {}", friendId);
            } catch (Exception e) {
                log.error("Failed to send status change to friend {}: {}", friendId, e.getMessage());
            }
        }
    }
}
