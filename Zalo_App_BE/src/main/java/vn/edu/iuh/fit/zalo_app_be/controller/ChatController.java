
package vn.edu.iuh.fit.zalo_app_be.controller;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import vn.edu.iuh.fit.zalo_app_be.common.MessageType;
import vn.edu.iuh.fit.zalo_app_be.controller.request.MessageRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.response.MessageResponse;
import vn.edu.iuh.fit.zalo_app_be.service.MessageService;
import vn.edu.iuh.fit.zalo_app_be.service.WebSocketService;

@Controller
@RequiredArgsConstructor
@Slf4j(topic = "CHAT-CONTROLLER")
public class ChatController {
    private final WebSocketService webSocketService;
    private final MessageService messageService;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload MessageRequest request) {
        log.debug("Processing chat request: sender={}, receiver={}",
                request.getSenderId(), request.getReceiverId());
        try {
            if (request.getSenderId() == null) {
                throw new RuntimeException("Invalid message request: missing senderId");
            }

            if (request.getReceiverId() == null && request.getGroupId() == null) {
                throw new RuntimeException("Invalid message request: missing receiverId or groupId");
            }

            MessageResponse response = messageService.saveMessage(request);

            request.setId(response.getId());
            request.setRecalled(response.isRecalled());
            request.setDeletedByUsers(response.getDeletedByUsers());
            request.setSenderId(request.getSenderId());
            request.setReceiverId(request.getReceiverId());
            request.setGroupId(request.getGroupId());
            request.setContent(request.getContent());
            request.setType(request.getType() != null ? request.getType() : MessageType.TEXT);

            if (request.getGroupId() != null) {
                webSocketService.sendGroupMessage(request);
                log.info("Group message sent from {} to group {}: {}",
                        request.getSenderId(), request.getGroupId(), request.getContent());
            } else {
                webSocketService.sendMessage(request);
                log.info("Message sent from {} to {}: {}",
                        request.getSenderId(), request.getReceiverId(), request.getContent());
            }

        } catch (Exception e) {
            log.error("Error processing message: sender={}, receiver={}, error={}",
                    request.getSenderId(), request.getReceiverId(), e.getMessage());
            throw e;
        }

    }

    @MessageMapping("/chat.recall")
    public void recallMessage(@Payload MessageRequest request) {
        String messageId = request.getId();
        String userId = request.getSenderId();

        log.debug("Processing recall message request: messageId={}, userId={}",
                messageId, userId);
        try {
            if (messageId == null || userId == null) {
                throw new RuntimeException("Invalid recall message request: missing messageId or userId");
            }

            messageService.recallMessage(messageId, userId);
            if (request.getGroupId() != null) {
                webSocketService.notifyGroupRecall(messageId, userId, request.getGroupId());
            } else {
                webSocketService.notifyRecall(messageId, userId);
            }
            log.info("Message recalled: messageId={}, userId={}",
                    messageId, userId);
        } catch (Exception e) {
            log.error("Error processing recall message: messageId={}, userId={}, error={}",
                    messageId, userId, e.getMessage());
            throw e;
        }
    }

    @MessageMapping("/chat.delete")
    public void deleteMessage(@Payload MessageRequest request) {
        String messageId = request.getId();
        String userId = request.getSenderId();

        log.debug("Processing delete message request: messageId={}, userId={}",
                messageId, userId);
        try {
            if (messageId == null || userId == null) {
                throw new RuntimeException("Invalid delete message request: missing messageId or userId");
            }

            messageService.deleteMessage(messageId, userId);
            if (request.getGroupId() != null) {
                webSocketService.notifyGroupDelete(messageId, userId, request.getGroupId());
            } else {
                webSocketService.notifyDelete(messageId, userId);
            }
            log.info("Message deleted: messageId={}, userId={}",
                    messageId, userId);
        } catch (Exception e) {
            log.error("Error processing delete message: messageId={}, userId={}, error={}",
                    messageId, userId, e.getMessage());
            throw e;
        }
    }

    @MessageMapping("/chat.forward")
    public void forwardMessage(@Payload MessageRequest request) {
        String messageId = request.getId();
        String userId = request.getSenderId();
        String receiverId = request.getReceiverId();
        String groupId = request.getGroupId();

        log.debug("Processing forward message request: messageId={}, userId={}, receiverId={}, groupId={}",
                messageId, userId, receiverId, groupId);
        try {
            if (messageId == null || userId == null || (receiverId == null && groupId == null)) {
                throw new RuntimeException("Invalid forward message request: missing messageId, userId or receiverId");
            }

            MessageResponse response = messageService.forwardMessage(messageId, userId, receiverId, groupId);
            if (groupId != null) {
                webSocketService.sendGroupMessage(new MessageRequest(userId, null, groupId, MessageType.FORWARD, response));
            } else {
                webSocketService.sendMessage(new MessageRequest(userId, receiverId, null, MessageType.FORWARD, response));
            }
            log.info("Message forwarded: messageId={}, userId={}, receiverId={}, groupId={}",
                    messageId, userId, receiverId, groupId);
        } catch (Exception e) {
            log.error("Error processing forward message: messageId={}, userId={}, receiverId={}, error={}",
                    messageId, userId, receiverId, e.getMessage());
            throw e;
        }
    }

    @MessageMapping("/chat.read")
    public void readMessage(@Payload MessageRequest request) {
        String messageId = request.getId();
        String senderId = request.getSenderId();
        String receiverId = request.getReceiverId();

        log.debug("Processing read message request: messageId={}, userId={}",
                messageId, receiverId);
        try {
            if (messageId == null || receiverId == null) {
                throw new RuntimeException("Invalid read message request: missing messageId or userId");
            }

            messageService.readMessage(messageId, receiverId);
            webSocketService.notifyRead(messageId, senderId);
            log.info("Message read: messageId={}, userId={}",
                    messageId, receiverId);
        } catch (Exception e) {
            log.error("Error processing read message: messageId={}, userId={}, error={}",
                    messageId, receiverId, e.getMessage());
            throw e;
        }
    }

    @MessageMapping("/chat.edit")
    public void editMessage(@Payload MessageRequest request) {
        String messageId = request.getId();
        String userId = request.getSenderId();
        String content = request.getContent();
        String groupId = request.getGroupId();

        log.debug("Processing edit message request: messageId={}, userId={}, content={}, groupId={}",
                messageId, userId, content, groupId);
        try {
            if (messageId == null || userId == null || content == null) {
                throw new RuntimeException("Invalid edit message request: missing messageId, userId or content");
            }

            messageService.editMessage(messageId, userId, content);
            if (request.getGroupId() != null) {
                webSocketService.notifyGroupEdit(messageId, userId, request.getGroupId());
            } else {
                webSocketService.notifyEdit(messageId, userId, content);
            }
            log.info("Message edited: messageId={}, userId={}, content={}",
                    messageId, userId, content);
        } catch (Exception e) {
            log.error("Error processing edit message: messageId={}, userId={}, error={}",
                    messageId, userId, e.getMessage());
            throw e;
        }
    }
    @MessageMapping("/chat.pin")
    public void pinMessage(@Payload MessageRequest request) {
        String messageId = request.getId();
        String userId = request.getSenderId();

        log.debug("Processing pin message request: messageId={}, userId={}",
                messageId, userId);

        try {
            if (messageId == null || userId == null) {
                throw new IllegalArgumentException("Invalid pin message request: missing messageId or userId");
            }

            messageService.pinMessage(messageId, userId);
            webSocketService.notifyPin(messageId, userId);
            log.info("Message pinned: messageId={}, userId={}",
                    messageId, userId);
        } catch (Exception e) {
            log.error("Error processing pin message: messageId={}, userId={}, error={}",
                    messageId, userId, e.getMessage());
            throw e;
        }
    }

    @MessageMapping("/chat.unpin")
    public void unpinMessage(@Payload MessageRequest request) {
        String messageId = request.getId();
        String userId = request.getSenderId();

        log.debug("Processing unpin message request: messageId={}, userId={}",
                messageId, userId);

        try {
            if (messageId == null || userId == null) {
                throw new IllegalArgumentException("Invalid unpin message request: missing messageId or userId");
            }

            messageService.unpinMessage(messageId, userId);
            webSocketService.notifyUnpin(messageId, userId);
            log.info("Message unpinned: messageId={}, userId={}",
                    messageId, userId);
        } catch (Exception e) {
            log.error("Error processing unpin message: messageId={}, userId={}, error={}",
                    messageId, userId, e.getMessage());
            throw e;
        }
    }
}
