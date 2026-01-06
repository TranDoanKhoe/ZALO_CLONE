import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Typography, Snackbar, Alert
} from '@mui/material';

import {
  addGroupMembers,
  removeGroupMember,
  fetchGroupMembers
} from '../../api/groupApi';
import { fetchFriendsList } from '../../api/user';

const SettingGroup = ({ open, onClose, groupId, token }) => {
  const [members, setMembers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (open) {
      loadMembers();
      loadFriends();
    }
  }, [open]);

  const loadMembers = async () => {
    try {
      const fetched = await fetchGroupMembers(groupId, token);
      setMembers(fetched);
    } catch (error) {
      console.error('Lỗi tải thành viên:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const fetched = await fetchFriendsList();
      setFriends(fetched);
    } catch (error) {
      console.error('Lỗi tải danh sách bạn bè:', error);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddFriendToGroup = async (friendId) => {
    try {
      await addGroupMembers(groupId, [friendId], token);
      showSnackbar('Thêm thành viên thành công!');
      await loadMembers();
    } catch (error) {
      console.error('Lỗi khi thêm bạn:', error);
      showSnackbar('Không thể thêm thành viên.', 'error');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await removeGroupMember(groupId, userId, token);
      await loadMembers();
      showSnackbar('Đã xóa thành viên.');
    } catch (error) {
      console.error('Lỗi khi xóa thành viên:', error);
      showSnackbar('Không thể xóa thành viên.', 'error');
    }
  };

  // Kiểm tra xem một người dùng đã là thành viên của nhóm chưa
  const isMember = (userId) => {
    return members.some(member => member.id === userId);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Quản lý nhóm</DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle1" gutterBottom>Thành viên hiện tại:</Typography>
        <List dense>
          {members.map((member) => (
            <ListItem
              key={member.id}
              secondaryAction={
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  Xóa
                </Button>
              }
            >
              <ListItemAvatar>
                <Avatar src={member.avatar || '/default-avatar.png'} />
              </ListItemAvatar>
              <ListItemText
                primary={`${member.firstName} ${member.lastName}`}
                secondary={member.phone}
              />
            </ListItem>
          ))}
        </List>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Thêm từ danh sách bạn bè:
        </Typography>
        <List dense>
          {friends.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
              Không có bạn bè nào.
            </Typography>
          ) : (
            friends.map((friend) => (
              <ListItem
                key={friend.id}
                secondaryAction={
                  isMember(friend.id) ? (
                    <Typography variant="body2" color="textSecondary">
                      Đã là thành viên
                    </Typography>
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleAddFriendToGroup(friend.id)}
                    >
                      Thêm
                    </Button>
                  )
                }
              >
                <ListItemAvatar>
                  <Avatar src={friend.avatar || '/default-avatar.png'} />
                </ListItemAvatar>
                <ListItemText
                  primary={friend.name}
                  secondary={friend.phone}
                />
              </ListItem>
            ))
          )}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">Đóng</Button>
      </DialogActions>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default SettingGroup;
