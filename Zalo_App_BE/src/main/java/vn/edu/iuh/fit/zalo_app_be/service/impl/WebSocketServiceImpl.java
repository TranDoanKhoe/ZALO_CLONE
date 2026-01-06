
package vn.edu.iuh.fit.zalo_app_be.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.zalo_app_be.common.MessageType;
import vn.edu.iuh.fit.zalo_app_be.controller.request.MessageRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.response.MessageResponse;
import vn.edu.iuh.fit.zalo_app_be.exception.MessageSendException;
import vn.edu.iuh.fit.zalo_app_be.exception.ResourceNotFoundException;
import vn.edu.iuh.fit.zalo_app_be.model.Group;
import vn.edu.iuh.fit.zalo_app_be.repository.MessageRepository;
import vn.edu.iuh.fit.zalo_app_be.service.MessageService;
import vn.edu.iuh.fit.zalo_app_be.service.WebSocketService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "WEB-SOCKET-SERVICE")
public class WebSocketServiceImpl implements WebSocketService {
    private final SimpMessagingTemplate template;
    private final MessageService messageService;
    private final MessageRepository messageRepository;

    @Override
    public void sendMessage(MessageRequest request) {
        if (request.getType() == MessageType.FORWARD) {
            template.convertAndSendToUser(request.getReceiverId(), "/queue/forward", request.getContent());
            log.info("Forwarded message from {} to {}: {}", request.getSenderId(), request.getReceiverId(), request.getContent());
        }
        try {
            template.convertAndSendToUser(request.getSenderId(), "/queue/messages", request);
            template.convertAndSendToUser(request.getReceiverId(), "/queue/messages", request);

            log.info("Message sent from {} to {}: {}", request.getSenderId(), request.getReceiverId(), request.getContent());
        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage());
            throw new MessageSendException("Error sending message");
        }
    }

    @Override
    public void sendGroupMessage(MessageRequest request) {
        if (request.getType() == MessageType.FORWARD) {
            template.convertAndSend("/topic/group" + request.getGroupId(), request.getResponse());
            log.info("Forwarded message from {} to group {}: {}", request.getSenderId(), request.getGroupId(), request.getContent());
        }
        try {
            template.convertAndSend("/topic/group/" + request.getGroupId(), request);
            log.info("Group message sent from {} to group {}: {}", request.getSenderId(), request.getGroupId(), request.getContent());
        } catch (Exception e) {
            log.error("Error sending group message: {}", e.getMessage());
            throw new MessageSendException("Error sending group message");
        }
    }

    @Override
    public void notifyFriendRequest(String senderId, String receiverId) {
        if (senderId == null || receiverId == null) {
            log.error("Cannot send friend request notification: senderId or receiverId is null");
            throw new ResourceNotFoundException("Cannot send friend request notification: senderId or receiverId is null");
        }

        Map<String, Object> notification = new HashMap<>();
        notification.put("senderId", senderId);
        notification.put("receiverId", receiverId);

        template.convertAndSendToUser(receiverId, "/queue/friend/request", notification);
        log.info("Friend request notification sent to {} from {}", senderId, receiverId);
    }

    @Override
    public void notifyFriendRequestAccepted(String senderId, String receiverId) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("senderId", senderId);
        notification.put("receiverId", receiverId);

        template.convertAndSendToUser(receiverId, "queue/friend/request/accepted", notification);
        log.info("Friend request accepted notification sent to {} from {}", receiverId, senderId);
    }

    @Override
    public void notifyFriendRequestRejected(String userId, String receiverId) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("userId", userId);
        notification.put("receiverId", receiverId);

        template.convertAndSendToUser(userId, "/queue/friend/request/rejected", notification);
        log.info("Friend request rejected notification sent to {} from {}", receiverId, userId);
    }

    @Override
    public void notifyFriendDeleted(String userId, String friendId) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("userId", userId);
        notification.put("friendId", friendId);

        template.convertAndSendToUser(friendId, "/queue/friend/deleted", notification);
        log.info("Friend deleted notification sent to {} from {}", friendId, userId);
    }

    @Override
    public void notifyUserBlocked(String userId, String blockedUserId) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("userId", userId);
        notification.put("blockedUserId", blockedUserId);

        template.convertAndSendToUser(blockedUserId, "/queue/user/blocked", notification);
        log.info("User blocked notification sent to {} from {}", blockedUserId, userId);
    }

    @Override
    public void notifyUserUnblocked(String userId, String unblockedUserId) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("userId", userId);
        notification.put("unblockedUserId", unblockedUserId);

        template.convertAndSendToUser(unblockedUserId, "/queue/user/unblocked", notification);
        log.info("User unblocked notification sent to {} from {}", unblockedUserId, userId);
    }

    @Override
    public void notifyRecall(String messageId, String userId) {
        MessageResponse messageResponse = messageService.convertToMessageResponse(messageRepository.findById(messageId).orElseThrow());
        template.convertAndSendToUser(userId, "/queue/recall", messageResponse);
        if (!userId.equals(messageResponse.getReceiverId())) {
            template.convertAndSendToUser(messageResponse.getReceiverId(), "/queue/recall", messageResponse);
        }
        log.info("Recall notification sent for message {} to user {}", messageId, userId);
    }

    @Override
    public void notifyGroupRecall(String messageId, String userId, String groupId) {
        MessageResponse response = messageService.convertToMessageResponse(
                messageRepository.findById(messageId).orElseThrow()
        );
        template.convertAndSend("/topic/group/" + groupId, response);
    }

    @Override
    public void notifyDelete(String messageId, String userId) {
        MessageResponse messageResponse = messageService.convertToMessageResponse(messageRepository.findById(messageId).orElseThrow());
        template.convertAndSendToUser(userId, "/queue/delete", messageResponse);
        log.info("Delete notification sent for message {} to user {}", messageId, userId);
    }

    @Override
    public void notifyGroupDelete(String messageId, String userId, String groupId) {
        MessageResponse response = messageService.convertToMessageResponse(
                messageRepository.findById(messageId).orElseThrow()
        );
        template.convertAndSend("/topic/group/" + groupId, response);
        log.info("Group delete notification sent for message {} to user {}", messageId, userId);
    }

    @Override
    public void notifyRead(String messageId, String userId) {
        MessageResponse response = messageService.convertToMessageResponse(messageRepository.findById(messageId).orElseThrow());
        template.convertAndSendToUser(userId, "/queue/read", response);
        log.info("Read notification sent for message {} to user {}", messageId, userId);
    }

    @Override
    public void notifyEdit(String messageId, String userId, String content) {
        MessageResponse response = messageService.convertToMessageResponse(messageRepository.findById(messageId).orElseThrow());
        template.convertAndSendToUser(userId, "/queue/edit", response);
        if (!userId.equals(response.getReceiverId())) {
            template.convertAndSendToUser(response.getReceiverId(), "/queue/edit", response);
        }

        log.info("Edit notification sent for message {} to user {}", messageId, userId);
    }

    public void notifyGroupEdit(String messageId, String userId, String groupId) {
        MessageResponse response = messageService.convertToMessageResponse(messageRepository.findById(messageId).orElseThrow());
        template.convertAndSend("/topic/group/" + groupId, response);
        log.info("Group edit notification sent for message {} to user {}", messageId, userId);
    }

    @Override
    public void notifyPin(String messageId, String userId) {
        MessageResponse response = messageService.convertToMessageResponse(messageRepository.findById(messageId).orElseThrow());
        template.convertAndSendToUser(userId, "/queue/pin", response);
        if (response.getGroupId() != null) {
            template.convertAndSend("/topic/group/" + response.getGroupId(), response);
        }
        log.info("Pin notification sent for message {} to user {}", messageId, userId);
    }

    @Override
    public void notifyUnpin(String messageId, String userId) {
        MessageResponse response = messageService.convertToMessageResponse(messageRepository.findById(messageId).orElseThrow());
        template.convertAndSendToUser(userId, "/queue/unpin", response);
        if (response.getGroupId() != null) {
            template.convertAndSend("/topic/group/" + response.getGroupId(), response);
        }
        log.info("Unpin notification sent for message {} to user {}", messageId, userId);
    }

    @Override
    public void notifyGroupCreate(Group group) {
        for (String memberId : group.getMemberIds()) {
            template.convertAndSendToUser(memberId, "/queue/group/create", group);
            log.info("Group creation notification sent to {}: {}", memberId, group.getName());
        }
    }

    @Override
    public void notifyGroupUpdate(Group group, String actorId, List<String> affectedMemberIds, String action) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("group", group);
        notification.put("actorId", actorId);
        notification.put("affectedMemberIds", affectedMemberIds);
        notification.put("action", action);

        for (String memberId : group.getMemberIds()) {
            template.convertAndSendToUser(
                    memberId,
                    "/queue/group/updated",
                    notification
            );
        }

        if (affectedMemberIds != null) {
            for (String memberId : affectedMemberIds) {
                if (!group.getMemberIds().contains(memberId)) {
                    template.convertAndSendToUser(
                            memberId,
                            "/queue/group/updated",
                            notification
                    );
                }
            }
        }
    }

    @Override
    public void notifyGroupDelete(Group group) {
        for (String memberId : group.getMemberIds()) {
            template.convertAndSendToUser(memberId, "/queue/group/delete", group);
            log.info("Group deletion notification sent to {}: {}", memberId, group.getName());
        }
    }

    @Override
    public void sendMessageToUser(String receiverId, Object message) {
        try {
            template.convertAndSendToUser(receiverId, "/queue/messages", message);
            log.info("Message sent to user {}: {}", receiverId, message);
        } catch (Exception e) {
            log.error("Error sending message to user {}: {}", receiverId, e.getMessage());
            throw new MessageSendException("Error sending message to user");
        }
    }

    @Override
    public void sendMessageToGroup(String groupId, Object message) {
        try {
            template.convertAndSend("/topic/group/" + groupId, message);
            log.info("Message sent to group {}: {}", groupId, message);
        } catch (Exception e) {
            log.error("Error sending message to group {}: {}", groupId, e.getMessage());
            throw new MessageSendException("Error sending message to group");
        }
    }


}
