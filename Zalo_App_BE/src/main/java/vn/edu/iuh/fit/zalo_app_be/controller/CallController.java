package vn.edu.iuh.fit.zalo_app_be.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class CallController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Handle WebRTC signaling messages (offer, answer, ICE candidates)
     * Endpoint: /app/call.signal
     */
    @MessageMapping("/call.signal")
    public void handleCallSignal(
            @Payload Map<String, Object> signal,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        try {
            String senderId = (String) headerAccessor.getSessionAttributes().get("userId");
            String receiverId = (String) signal.get("receiverId");
            String signalType = (String) signal.get("type");
            Object data = signal.get("data");

            if (senderId == null || receiverId == null || signalType == null) {
                System.err.println("Invalid call signal: missing required fields");
                return;
            }

            // Create signal message to forward to receiver
            Map<String, Object> signalMessage = Map.of(
                    "type", signalType,
                    "data", data != null ? data : Map.of(),
                    "senderId", senderId,
                    "receiverId", receiverId,
                    "timestamp", signal.getOrDefault("timestamp", System.currentTimeMillis())
            );

            // Send signal to receiver's queue
            messagingTemplate.convertAndSendToUser(
                    receiverId,
                    "/queue/call",
                    signalMessage
            );

            System.out.println("Forwarded call signal: " + signalType + " from " + senderId + " to " + receiverId);

        } catch (Exception e) {
            System.err.println("Error handling call signal: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
