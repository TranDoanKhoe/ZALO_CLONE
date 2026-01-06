/*
 * @ (#) MessageResponse.java       1.0     4/17/2025
 *
 * Copyright (c) 2025. All rights reserved.
 */

package vn.edu.iuh.fit.zalo_app_be.controller.response;
/*
 * @author: Luong Tan Dat
 * @date: 4/17/2025
 */

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import vn.edu.iuh.fit.zalo_app_be.common.MessageStatus;
import vn.edu.iuh.fit.zalo_app_be.common.MessageType;
import vn.edu.iuh.fit.zalo_app_be.model.MessageReference;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class MessageResponse {
    private String id;
    private String senderId;
    private String receiverId;
    private String groupId;
    private String content;
    private MessageType type;
    private List<String> imageUrls;
    private List<Map<String, String>> videoInfos;
    private String fileName;
    private String replyToMessageId;
    private String thumbnail;
    private String publicId;
    private boolean recalled;
    private List<String> deletedByUsers;
    private MessageStatus status;
    private MessageReference forwardedFrom;
    private boolean isRead;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private boolean isPinned;
    private LocalDateTime pinnedAt;
}
