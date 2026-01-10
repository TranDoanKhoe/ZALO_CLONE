

package vn.edu.iuh.fit.zalo_app_be.service.impl;


import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.iuh.fit.zalo_app_be.common.Roles;
import vn.edu.iuh.fit.zalo_app_be.controller.request.GroupRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.response.GroupResponse;
import vn.edu.iuh.fit.zalo_app_be.exception.ResourceNotFoundException;
import vn.edu.iuh.fit.zalo_app_be.model.Group;
import vn.edu.iuh.fit.zalo_app_be.model.User;
import vn.edu.iuh.fit.zalo_app_be.repository.GroupRepository;
import vn.edu.iuh.fit.zalo_app_be.repository.UserRepository;
import vn.edu.iuh.fit.zalo_app_be.service.GroupService;
import vn.edu.iuh.fit.zalo_app_be.service.WebSocketService;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "GROUP-SERVICE")
public class GroupServiceImpl implements GroupService {
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final WebSocketService webSocketService;
    private final Cloudinary cloudinary;

    @Override
    public GroupResponse createGroup(GroupRequest request) {
        validateGroup(request.getName(), request.getMemberIds(), request.getCreateId());
        Group group = new Group();
        group.setName(request.getName());
        group.setCreateId(request.getCreateId());
        group.setMemberIds(new ArrayList<>(request.getMemberIds()));
        group.setAvatarGroup(request.getAvatarGroup());
        Map<String, Roles> roles = new HashMap<>();
        roles.put(request.getCreateId(), Roles.ADMIN);
        for (String memberId : request.getMemberIds()) {
            if (!memberId.equals(request.getCreateId())) {
                roles.put(memberId, Roles.MEMBER);
            }
        }
        group.setRoles(roles);
        group.setCreateAt(LocalDateTime.now());
        group.setUpdateAt(LocalDateTime.now());
        group.setActive(true);
        groupRepository.save(group);

        log.info("Group created: {}", group);

        webSocketService.notifyGroupCreate(group);

        return convertToGroupResponse(group);
    }

    @Override
    public GroupResponse addMember(String groupId, List<String> memberIds) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        User user = (User) authentication.getPrincipal();

        Optional<Group> group = groupRepository.findById(groupId);
        if (group.isEmpty()) {
            throw new ResourceNotFoundException("Group not found");
        }

        if (!group.get().isActive()) {
            throw new ResourceNotFoundException("Group is not active");
        }

        for (String memberId : memberIds) {
            if (userRepository.findById(memberId).isEmpty()) {
                throw new ResourceNotFoundException("Thành viên không tồn tại: " + memberId);
            }
            if (group.get().getMemberIds().contains(memberId)) {
                throw new IllegalArgumentException("Thành viên đã có trong nhóm: " + memberId);
            }
        }

        group.get().getMemberIds().addAll(memberIds);

        for (String memberId : memberIds) {
            group.get().getRoles().put(memberId, Roles.MEMBER);
        }

        groupRepository.save(group.get());

        webSocketService.notifyGroupUpdate(group.get(), user.getId(), memberIds, "ADD_MEMBER");

        return convertToGroupResponse(group.get());
    }

    @Override
    public GroupResponse removeMember(String groupId, String memberId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        User user = (User) authentication.getPrincipal();
        Optional<Group> group = groupRepository.findById(groupId);
        if (group.isEmpty()) {
            throw new ResourceNotFoundException("Group not found");
        }

        if (!group.get().isActive()) {
            throw new IllegalStateException("Nhóm đã bị giải tán");
        }
        if (!group.get().getMemberIds().contains(memberId)) {
            throw new ResourceNotFoundException("Thành viên không có trong nhóm: " + memberId);
        }
        validateAdmin(group.get(), user.getId());

        group.get().getMemberIds().remove(memberId);
        group.get().getRoles().remove(memberId);

        groupRepository.save(group.get());

        log.info("Member {} removed from group {}", memberId, groupId);

        webSocketService.notifyGroupUpdate(group.get(), user.getId(), List.of(memberId), "REMOVE_MEMBER");

        return convertToGroupResponse(group.get());

    }

    @Override
    public void dissolveGroup(String groupId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        User user = (User) authentication.getPrincipal();
        Optional<Group> group = groupRepository.findById(groupId);
        if (group.isEmpty()) {
            throw new ResourceNotFoundException("Group not found");
        }

        validateAdmin(group.get(), user.getId());

        group.get().setActive(false);
        groupRepository.save(group.get());
        log.info("Group {} dissolved by {}", groupId, user.getId());

        webSocketService.notifyGroupDelete(group.get());
    }

    @Override
    public GroupResponse assignRole(String groupId, String userId, Roles role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        User user = (User) authentication.getPrincipal();
        Optional<Group> group = groupRepository.findById(groupId);
        if (group.isEmpty()) {
            throw new ResourceNotFoundException("Group not found");
        }

        validateAdmin(group.get(), user.getId());

        if (!group.get().getMemberIds().contains(userId)) {
            throw new ResourceNotFoundException("User not in the group");
        }

        group.get().getRoles().put(userId, role);

        groupRepository.save(group.get());

        log.info("User {} assigned role {} in group {}", userId, role, groupId);
        return convertToGroupResponse(group.get());
    }

    @Override
    public List<GroupResponse> getGroupByUser(String userId) {
        return groupRepository.findByMemberIdsContaining(userId)
                .stream()
                .filter(Group::isActive)
                .map(this::convertToGroupResponse)
                .collect(Collectors.toList());
    }

    @Override
    public GroupResponse getUserInGroup(String groupId) {
        Optional<Group> group = groupRepository.findById(groupId);
        if (group.isEmpty()) {
            throw new ResourceNotFoundException("Group not found");
        }
        return convertToGroupResponse(group.get());
    }

    @Override
    public GroupResponse updateGroup(String groupId, GroupRequest request, MultipartFile file) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        Optional<Group> group = groupRepository.findById(groupId);
        if (group.isEmpty()) {
            throw new ResourceNotFoundException("Group not found");
        }

        // Chỉ update name nếu có giá trị
        if (request.getName() != null && !request.getName().isEmpty()) {
            group.get().setName(request.getName());
        }

        if (file != null && !file.isEmpty()) {
            if (file.getSize() > 10 * 1024 * 1024) {
                throw new ResourceNotFoundException("File size exceeds limit");
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                log.error("Invalid file type: {}", contentType);
                throw new ResourceNotFoundException("Invalid file type");
            }

            try {
                Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("resource_type", "image", "folder", "user_avatars"));
                String avatarUrl = (String) uploadResult.get("secure_url");
                group.get().setAvatarGroup(avatarUrl);
                log.info("Avatar uploaded to Cloudinary: {} for group: {}", avatarUrl, group.get().getId());
            } catch (Exception e) {
                log.error("Error uploading avatar to Cloudinary: {}", e.getMessage());
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload avatar");
            }
        }

        log.info("Group updated: {}", group.get());

        groupRepository.save(group.get());

        webSocketService.notifyGroupUpdate(group.get(), user.getId(), List.of(user.getId()), "UPDATE_GROUP");

        return convertToGroupResponse(group.get());
    }

    @Override
    public GroupResponse setAdmin(String groupId, String memberId, boolean isAdmin, String userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        Optional<Group> group = groupRepository.findById(groupId);
        if (group.isEmpty()) {
            throw new ResourceNotFoundException("Group not found");
        }

        validateAdmin(group.get(), userId);

        if (isAdmin) {
            group.get().getRoles().put(memberId, Roles.ADMIN);
        } else {
            if (group.get().getRoles().get(memberId).equals(Roles.ADMIN)) {
                if (group.get().getRoles().values().stream().filter(r -> r.equals(Roles.ADMIN)).count() == 1) {
                    throw new IllegalStateException("Dont remove the last admin");
                }
                group.get().getRoles().put(memberId, Roles.MEMBER);
            }
        }
        groupRepository.save(group.get());
        log.info("User {} set as admin in group {}", memberId, groupId);

        webSocketService.notifyGroupUpdate(group.get(), user.getId(), List.of(memberId), "SET_ADMIN");

        return convertToGroupResponse(group.get());
    }

    private void validateGroup(String name, List<String> memberIds, String createId) {
        if (name == null || name.isEmpty()) {
            throw new ResourceNotFoundException("Group name cannot be empty");
        }
        if (memberIds == null || memberIds.isEmpty()) {
            throw new ResourceNotFoundException("Member IDs cannot be empty");
        }
        if (userRepository.findById(createId).isEmpty()) {
            throw new ResourceNotFoundException("Creator ID cannot be empty");
        }
        for (String memberId : memberIds) {
            if (userRepository.findById(memberId).isEmpty()) {
                throw new ResourceNotFoundException("Member ID cannot be empty");
            }
        }
    }

    private void validateAdmin(Group group, String userId) {
        Roles role = group.getRoles().get(userId);
        if (!role.equals(Roles.ADMIN)) {
            throw new ResourceNotFoundException("Only admin can perform this action");
        }
    }

    private GroupResponse convertToGroupResponse(Group group) {
        return GroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .createId(group.getCreateId())
                .memberIds(group.getMemberIds())
                .roles(group.getRoles())
                .avatarGroup(group.getAvatarGroup())
                .createAt(group.getCreateAt())
                .updateAt(group.getUpdateAt())
                .isActive(group.isActive())
                .build();
    }
}
