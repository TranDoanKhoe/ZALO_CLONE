

package vn.edu.iuh.fit.zalo_app_be.controller.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.edu.iuh.fit.zalo_app_be.common.MessageStatus;
import vn.edu.iuh.fit.zalo_app_be.common.MessageType;
import vn.edu.iuh.fit.zalo_app_be.controller.response.MessageResponse;
import vn.edu.iuh.fit.zalo_app_be.model.MessageReference;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Setter
@Getter
@NoArgsConstructor
public class MessageRequest {
    private String id;
    private String senderId;
    private String receiverId;
    private String content;
    private String groupId;
    private MessageType type;
    private List<String> imageUrls;
    private List<Map<String, String>> videoInfos;
    private String fileName;
    private String replyToMessageId;
    private String thumbnail;
    private MessageReference forwardedFrom;
    private List<String> deletedByUsers;
    private MessageStatus status;
    private boolean recalled;
    private boolean isPinned;
    private LocalDateTime pinnedAt;
    private MessageResponse response;

    public MessageRequest(String senderId, String receiverId, String groupId, MessageType messageType, MessageResponse response) {
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.groupId = groupId;
        this.type = messageType;
        this.response = response;
        if (response != null) {
            this.id = response.getId();
            this.content = response.getContent() != null ? response.getContent() : "";
            this.imageUrls = response.getImageUrls() != null ? response.getImageUrls() : new ArrayList<>();
            this.videoInfos = response.getVideoInfos() != null ? response.getVideoInfos() : new ArrayList<>();
            this.fileName = response.getFileName();
            this.replyToMessageId = response.getReplyToMessageId();
            this.thumbnail = response.getThumbnail();;
            this.recalled = response.isRecalled();
            this.deletedByUsers = response.getDeletedByUsers() != null ? response.getDeletedByUsers() : new ArrayList<>();
            this.status = response.getStatus();
            this.forwardedFrom = response.getForwardedFrom();
            this.isPinned = response.isPinned();
            this.pinnedAt = response.getPinnedAt();
        }
    }
}
