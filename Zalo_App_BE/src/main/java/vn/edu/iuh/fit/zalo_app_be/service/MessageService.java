

package vn.edu.iuh.fit.zalo_app_be.service;


import org.springframework.web.multipart.MultipartFile;
import vn.edu.iuh.fit.zalo_app_be.controller.request.MessageRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.response.MessageResponse;
import vn.edu.iuh.fit.zalo_app_be.model.Message;

import java.util.List;
import java.util.Map;

public interface MessageService {
    MessageResponse saveMessage(MessageRequest request);

    Map<String,String> uploadFile(MultipartFile files, MessageRequest request);

    List<MessageResponse> getChatHistory(String userOtherId);

    List<MessageResponse> getGroupChatHistory(String groupId);

    void recallMessage(String messageId, String userId);

    void deleteMessage(String messageId, String userId);

    MessageResponse forwardMessage(String messageId, String userId, String receiverId, String groupId);

    void readMessage(String messageId, String receiverId);

    void editMessage(String messageId, String userId,String content);

    MessageResponse convertToMessageResponse(Message message);

    void pinMessage(String messageId, String userId);

    void unpinMessage(String messageId, String userId);

    List<MessageResponse> getPinnedMessages(String userId, String groupId);

    List<MessageResponse> searchMessages(String userId, String otherUserId, String groupId, String keyword);
}
