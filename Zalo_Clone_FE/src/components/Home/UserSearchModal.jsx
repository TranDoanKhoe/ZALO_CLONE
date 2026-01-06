import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import { BiSearch, BiUserPlus } from 'react-icons/bi';
import { sendFriendRequest, fetchUserByPhone, fetchFriendsList } from '../../api/user';

const UserSearchModal = ({ open, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [resultMessage, setResultMessage] = useState({ type: '', message: '' });
  const [userFound, setUserFound] = useState(null);
  const token = localStorage.getItem("accessToken");
  const userId = localStorage.getItem("userId");
  
  const handleSearch = async () => {
    if (!phoneNumber.trim()) {
      setResultMessage({ type: 'error', message: 'Vui lòng nhập số điện thoại để tìm kiếm' });
      return;
    }

    setIsLoading(true);
    setSearchPerformed(true);
    
    try {
      const userData = await fetchUserByPhone(phoneNumber);
      console.log('User data from API:', userData); // Debug
      
      if (userData) {
        // Kiểm tra friendStatus từ API hoặc gọi API riêng để check
        let friendStatus = userData.friendStatus || 'NONE';
        
        // Nếu API không trả friendStatus, check thủ công
        if (!userData.friendStatus) {
          try {
            const friendsList = await fetchFriendsList(token);
            const isFriend = friendsList?.some(friend => friend.id === userData.id);
            if (isFriend) {
              friendStatus = 'FRIEND';
            }
          } catch (err) {
            console.error('Error checking friend status:', err);
          }
        }
        
        // Ánh xạ dữ liệu từ API vào cấu trúc frontend cần
        const fullName = userData.name || 
                        `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
                        userData.username ||
                        userData.phone;
        setUserFound({
          id: userData.id,
          name: fullName,
          phone: userData.phone,
          avatar: userData.avatar || "https://i.pravatar.cc/150?img=" + Math.floor(Math.random() * 70),
          friendStatus: friendStatus
        });
        setResultMessage({ type: 'success', message: 'Đã tìm thấy người dùng!' });
      } else {
        setResultMessage({ type: 'error', message: 'Không tìm thấy người dùng!' });
        setUserFound(null);
      }
    } catch (error) {
      console.error("Error searching for user:", error);
      setResultMessage({ 
        type: 'error', 
        message: error.message || 'Không thể tìm thấy người dùng với số điện thoại này' 
      });
      setUserFound(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!phoneNumber.trim()) {
      setResultMessage({ type: 'error', message: 'Số điện thoại không hợp lệ' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendFriendRequest(phoneNumber);
      if (result) {
        setResultMessage({ type: 'success', message: 'Đã gửi lời mời kết bạn thành công!' });
        // Reset search after successful friend request
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setResultMessage({ type: 'error', message: 'Gửi lời mời kết bạn thất bại!' });
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      setResultMessage({
        type: 'error',
        message: error.message || 'Có lỗi xảy ra khi gửi lời mời kết bạn'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Tìm kiếm bạn bè</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Nhập số điện thoại để tìm kiếm người dùng
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Nhập số điện thoại..."
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              endAdornment: (
                <Button 
                  onClick={handleSearch}
                  disabled={isLoading || !phoneNumber.trim()}
                  startIcon={<BiSearch />}
                >
                  Tìm
                </Button>
              ),
            }}
            disabled={isLoading}
          />
        </Box>

        {isLoading && (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        )}

        {searchPerformed && !isLoading && (
          <>
            {resultMessage.type && (
              <Alert severity={resultMessage.type} sx={{ mb: 2 }}>
                {resultMessage.message}
              </Alert>
            )}

            {userFound && (
              <Box 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box display="flex" alignItems="center">
                  <Avatar src={userFound.avatar} sx={{ width: 50, height: 50, mr: 2 }} />
                  <Box>
                    <Typography variant="subtitle1">{userFound.name}</Typography>
                    <Typography variant="body2" color="textSecondary">{userFound.phone}</Typography>
                  </Box>
                </Box>
                {userFound.friendStatus === 'FRIEND' ? (
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                    Đã là bạn bè
                  </Typography>
                ) : userFound.friendStatus === 'PENDING' ? (
                  <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    Đã gửi lời mời
                  </Typography>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<BiUserPlus />}
                    onClick={handleSendFriendRequest}
                    disabled={isLoading}
                  >
                    Kết bạn
                  </Button>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserSearchModal;
