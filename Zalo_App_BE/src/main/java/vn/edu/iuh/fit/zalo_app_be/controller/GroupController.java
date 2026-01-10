

package vn.edu.iuh.fit.zalo_app_be.controller;


import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.iuh.fit.zalo_app_be.common.Roles;
import vn.edu.iuh.fit.zalo_app_be.controller.request.GroupRequest;
import vn.edu.iuh.fit.zalo_app_be.controller.response.GroupResponse;
import vn.edu.iuh.fit.zalo_app_be.controller.response.UserResponse;
import vn.edu.iuh.fit.zalo_app_be.service.GroupService;
import vn.edu.iuh.fit.zalo_app_be.service.UserService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/group")
@Slf4j(topic = "GROUP-CONTROLLER")
public class GroupController {
    private final GroupService groupService;
    private final UserService userService;

    @PostMapping
    @Operation(summary = "Create a new group", description = "Create a new group with the given name and members.")
    public ResponseEntity<GroupResponse> createGroup(@RequestBody GroupRequest groupRequest) {
        log.info("Creating group with name: {}", groupRequest.getName());
        return new ResponseEntity<>(groupService.createGroup(groupRequest), HttpStatus.CREATED);
    }

    @PostMapping("/{groupId}/members")
    @Operation(summary = "Add members to a group", description = "Add members to the group with the given ID.")
    public ResponseEntity<GroupResponse> addMember(@PathVariable String groupId, @RequestBody List<String> userIds) {
        log.info("Adding user {} to group: {}", userIds, groupId);
        return new ResponseEntity<>(groupService.addMember(groupId, userIds), HttpStatus.OK);
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    @Operation(summary = "Remove a member from a group", description = "Remove a member from the group with the given ID.")
    public ResponseEntity<GroupResponse> removeMember(@PathVariable String groupId, @PathVariable String userId) {
        log.info("Removing user {} from group: {}", userId, groupId);
        return new ResponseEntity<>(groupService.removeMember(groupId, userId), HttpStatus.OK);
    }

    @DeleteMapping("/{groupId}")
    @Operation(summary = "Dissolve a group", description = "Dissolve the group with the given ID.")
    public ResponseEntity<Void> dissolveGroup(@PathVariable String groupId) {
        log.info("Dissolving group: {}", groupId);
        groupService.dissolveGroup(groupId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PutMapping("/{groupId}/roles/{userId}")
    @Operation(summary = "Assign a role to a user in a group", description = "Assign a role to a user in the group with the given ID.")
    public ResponseEntity<GroupResponse> assignRole(@PathVariable String groupId, @PathVariable String userId, @RequestParam Roles role) {
        log.info("Assigning role {} to user {} in group: {}", role, userId, groupId);
        return new ResponseEntity<>(groupService.assignRole(groupId, userId, role), HttpStatus.OK);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get groups by user ID", description = "Get all groups that the user with the given ID is a member of.")
    public ResponseEntity<List<GroupResponse>> getUserGroups(@PathVariable String userId) {
        log.info("Fetching groups for user: {}", userId);
        return new ResponseEntity<>(groupService.getGroupByUser(userId), HttpStatus.OK);
    }

    @GetMapping("/{groupId}/members")
    @Operation(summary = "Get members of a group", description = "Get all members of the group with the given ID.")
    public ResponseEntity<List<UserResponse>> getUserInGroup(@PathVariable String groupId) {
        log.info("Fetching members of group: {}", groupId);
        GroupResponse groupResponse = groupService.getUserInGroup(groupId);
        List<UserResponse> user = userService.findUsersByIds(groupResponse.getMemberIds());
        return new ResponseEntity<>(user, HttpStatus.OK);
    }

    @PutMapping("/{groupId}")
    @Operation(summary = "Update group information", description = "Update group name and/or avatar.")
    public ResponseEntity<GroupResponse> updateGroup(
            @PathVariable String groupId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) MultipartFile avatarGroup) {
        log.info("Updating group: {} with name: {}", groupId, name);
        GroupRequest request = new GroupRequest();
        request.setName(name);
        return new ResponseEntity<>(groupService.updateGroup(groupId, request, avatarGroup), HttpStatus.OK);
    }
}
