import React, { useState, useEffect, useCallback, useMemo, Component } from "react";
import { ThemeProvider, styled } from "@mui/material/styles";
import { CssBaseline, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import { Box, Typography, IconButton, Menu, MenuItem, Snackbar, Alert } from "@mui/material";
import { BiUserPlus, BiGroup, BiDotsVerticalRounded, BiSearch } from "react-icons/bi";
import { useNavigate, useLocation } from "react-router-dom";
import NavSidebar from "../components/Home/NavSidebar";
import ContactList from "../components/Home/ContactList";
import SettingsPanel from "../components/Home/SettingsPanel";
import ChatWindow from "../components/Home/ChatWindow";
import ProfileModal from "../components/Home/ProfileModal";
import UserSearchModal from "../components/Home/UserSearchModal";
import { fetchUserProfile, fetchFriendsList, sendFriendRequest, fetchPendingFriendRequests, acceptFriendRequest } from "../api/user";
import { getChatHistory, getGroupChatHistory, connectWebSocket, disconnectWebSocket } from "../api/messageApi";
import { createGroup, fetchUserGroups } from "../api/groupApi";
import { zaloTheme } from "../theme/theme";

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={3} textAlign="center">
          <Typography variant="h6" color="error">
            Đã xảy ra lỗi: {this.state.error?.message || "Không xác định"}
          </Typography>
          <Typography variant="body1">
            Vui lòng làm mới trang hoặc liên hệ hỗ trợ.
          </Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

const RootContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  height: "100vh",
  overflow: "hidden",
}));

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: 320,
  borderRight: "1px solid",
  borderColor: theme.palette.divider,
  display: "flex",
  flexDirection: "column",
}));

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token: navToken, userId: navUserId } = location.state || {};
  const [userId, setUserId] = useState(navUserId || localStorage.getItem('userId') || '680e6d95a73e35151128bf65');
  const [token, setToken] = useState(navToken || localStorage.getItem('accessToken'));
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [currentView, setCurrentView] = useState("messages");
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [showAddFriendInput, setShowAddFriendInput] = useState(false);
  const [friendPhoneInput, setFriendPhoneInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [openChangePasswordModal, setOpenChangePasswordModal] = useState(false);
  const [groupAvatar, setGroupAvatar] = useState(null);
  
  // Đồng bộ token với localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken !== token) {
      setToken(storedToken);
    }
  }, [token]);

  // Kiểm tra token và chuyển hướng ngay lập tức nếu không có token
  useEffect(() => {
    if (!token) {
      setSnackbarMessage('Vui lòng đăng nhập để sử dụng chức năng!');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      navigate("/"); // Chuyển hướng ngay lập tức về trang đăng nhập
      return;
    }

    let isMounted = true;

    const handleFriendRequest = async (notification) => {
      if (!isMounted) return;
      console.log('Received friend request notification:', notification);
      if (notification.type === 'accepted') {
        // Thông báo cho người gửi (A)
        await updateFriendsList(); // Làm mới danh sách bạn bè
        setSnackbarMessage('Yêu cầu kết bạn của bạn đã được chấp nhận!');
        setSnackbarSeverity('success');
      } else if (notification.type === 'confirmed') {
        // Thông báo cho người nhận (B)
        await updatePendingRequests(); // Làm mới danh sách yêu cầu
        setSnackbarMessage('Bạn đã chấp nhận một yêu cầu kết bạn!');
        setSnackbarSeverity('success');
      } else {
        // Yêu cầu kết bạn mới
        await updatePendingRequests();
        setSnackbarMessage('Bạn nhận được một yêu cầu kết bạn mới!');
        setSnackbarSeverity('info');
      }
      setOpenSnackbar(true);
    };

    updateGroups().then(groupIds => {
      if (!isMounted) return;

      connectWebSocket(
        token,
        userId,
        (receivedMessage) => {
          if (!isMounted) return;
          console.log('Received message in Home:', receivedMessage);
          setMessages((prev) => {
            const messageExistsById = prev.some(msg => msg.id === receivedMessage.id);
            if (messageExistsById) {
              return prev;
            }

            const messageExistsByContent = prev.find(msg =>
              msg.tempKey &&
              msg.content === receivedMessage.content &&
              msg.senderId === receivedMessage.senderId &&
              (msg.receiverId === receivedMessage.receiverId || msg.groupId === receivedMessage.groupId)
            );
            if (messageExistsByContent) {
              return prev.map((msg) =>
                msg.tempKey === messageExistsByContent.tempKey
                  ? { ...receivedMessage, tempKey: undefined }
                  : msg
              );
            }

            const deletedMessageIds = JSON.parse(localStorage.getItem('deletedMessageIds') || '[]');
            if (deletedMessageIds.includes(receivedMessage.id)) {
              return prev;
            }

            let createAt = receivedMessage.createdAt || receivedMessage.createAt;
            let parsedDate = new Date(createAt);
            if (isNaN(parsedDate.getTime())) {
              console.warn('Invalid createAt value:', createAt, 'Using current time as fallback');
              parsedDate = new Date();
            } else if (typeof createAt === 'string' && !createAt.endsWith('Z') && !createAt.includes('+')) {
              createAt = `${createAt}Z`;
              parsedDate = new Date(createAt);
            }

            return [...prev, {
              ...receivedMessage,
              createAt: parsedDate.toISOString(),
              recalled: receivedMessage.recalled || false,
              deletedByUsers: receivedMessage.deletedByUsers || [],
              isRead: receivedMessage.isRead || false,
              isPinned: receivedMessage.isPinned || false,
              isEdited: receivedMessage.isEdited || false,
            }];
          });
        },
        (deletedMessage) => {
          if (!isMounted) return;
          console.log('Received delete notification:', deletedMessage);
          if (deletedMessage.id) {
            const deletedMessageIds = JSON.parse(localStorage.getItem('deletedMessageIds') || '[]');
            if (!deletedMessageIds.includes(deletedMessage.id)) {
              deletedMessageIds.push(deletedMessage.id);
              localStorage.setItem('deletedMessageIds', JSON.stringify(deletedMessageIds));
            }
          }
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === deletedMessage.id
                ? { ...msg, deletedByUsers: deletedMessage.deletedByUsers || [] }
                : msg
            )
          );
        },
        (recalledMessage) => {
          if (!isMounted) return;
          console.log('Received recall notification:', recalledMessage);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === recalledMessage.id
                ? { ...msg, recalled: recalledMessage.recalled || false }
                : msg
            )
          );
        },
        (pinnedMessage) => {
          if (!isMounted) return;
          console.log('Received pin notification:', pinnedMessage);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === pinnedMessage.id
                ? { ...msg, isPinned: true }
                : msg
            )
          );
        },
        (unpinnedMessage) => {
          if (!isMounted) return;
          console.log('Received unpin notification:', unpinnedMessage);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === unpinnedMessage.id
                ? { ...msg, isPinned: false }
                : msg
            )
          );
        },
        groupIds,
        handleFriendRequest,
        (editedMessage) => {
          if (!isMounted) return;
          console.log('Received edit notification:', editedMessage);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === editedMessage.id
                ? { ...msg, content: editedMessage.content, isEdited: true }
                : msg
            )
          );
        }
      ).then(() => {
        if (!isMounted) return;
        console.log('STOMP connected in Home');
      }).catch((error) => {
        if (!isMounted) return;
        console.error('Failed to connect STOMP in Home:', error);
        setSnackbarMessage(`Không thể kết nối WebSocket: ${error.message}`);
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      });
    });

    return () => {
      isMounted = false;
      disconnectWebSocket();
    };
  }, [token, userId, navigate]);

  useEffect(() => {
    console.log('Home mounted with userId:', userId);
    if (profileOpen) {
      fetchUserProfile(token).then((data) => {
        if (data) {
          setUserProfile(data);
        }
      });
    }
    return () => {
      console.log('Home unmounting');
    };
  }, [profileOpen, token]);

  const updateGroups = useCallback(async () => {
    if (!token) return [];
    try {
      const groups = await fetchUserGroups(userId, token);
      const groupContacts = groups.map(group => ({
        id: group.id,
        name: group.name,
        isGroup: true,
        avatar: group.avatarGroup || "https://th.bing.com/th/id/R.0fb6fad84621ac768796c2c228858678?rik=EZHn72rbvK8jkg&pid=ImgRaw&r=0",
        status: 'group',
        lastMessage: group.lastMessage || '',
        timestamp: group.timestamp || 'Yesterday',
      }));
      setContacts(prev => [...prev.filter(c => !c.isGroup), ...groupContacts]);
      const groupIds = groups.map(group => group.id).filter(id => id);
      console.log('Group IDs for subscription:', groupIds);
      return groupIds;
    } catch (error) {
      setSnackbarMessage('Lỗi tải danh sách nhóm: ' + (error.response?.data?.message || error.message));
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return [];
    }
  }, [userId, token]);

  const updateFriendsList = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await fetchFriendsList(token);
      if (data) {
        setContacts(prev => [
          ...prev.filter(c => c.isGroup),
          ...data.map(friend => ({
            id: friend.id,
            name: friend.name,
            username: friend.name,
            avatar: friend.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
            status: friend.status || "offline",
            lastMessage: friend.lastMessage || "",
            unreadCount: friend.unreadCount || 0,
            timestamp: friend.timestamp || "Yesterday",
          })),
        ]);
      } else {
        setSnackbarMessage("Không thể tải danh sách bạn bè!");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("Lỗi tải danh sách bạn bè: " + (error.response?.data?.message || error.message));
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const updatePendingRequests = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await fetchPendingFriendRequests(token);
      if (data) {
        setPendingRequests(data.map(request => ({
          id: request.senderId,
          requestId: request.id,
          name: request.name,
          avatar: request.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        })));
      } else {
        setSnackbarMessage("Không thể tải danh sách lời mời!");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("Lỗi tải danh sách lời mời: " + (error.response?.data?.message || error.message));
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (currentView === "contacts" || currentView === "messages") {
      updateFriendsList();
      updatePendingRequests();
    }
  }, [currentView, updateFriendsList, updatePendingRequests]);

  useEffect(() => {
    if (!selectedContact || !token || !selectedContact.id) return;

    const loadChatHistory = async () => {
      try {
        let chatHistory;
        if (selectedContact.isGroup) {
          chatHistory = await getGroupChatHistory(selectedContact.id, token);
        } else {
          chatHistory = await getChatHistory(selectedContact.id, token);
        }
        console.log('Chat history loaded:', chatHistory);
        const uniqueMessages = chatHistory.reduce((acc, msg) => {
          if (!acc.some(item => item.id === msg.id)) {
            let createAt = msg.createAt || msg.createdAt;
            let parsedDate = new Date(createAt);
            if (isNaN(parsedDate.getTime())) {
              console.warn('Invalid createAt value in chat history:', createAt, 'Using current time as fallback');
              parsedDate = new Date();
            } else if (typeof createAt === 'string' && !createAt.endsWith('Z') && !createAt.includes('+')) {
              createAt = `${createAt}Z`;
              parsedDate = new Date(createAt);
            }
            acc.push({
              id: msg.id,
              senderId: msg.senderId,
              receiverId: msg.receiverId,
              groupId: msg.groupId,
              content: msg.content,
              type: msg.type,
              createAt: parsedDate.toISOString(),
              recalled: msg.recalled || false,
              deletedByUsers: msg.deletedByUsers || [],
              isRead: msg.isRead || false,
              isPinned: msg.isPinned || false,
              isEdited: msg.isEdited || false,
            });
          }
          return acc;
        }, []);
        setMessages(uniqueMessages);
      } catch (error) {
        setSnackbarMessage("Lỗi tải lịch sử tin nhắn: " + (error.response?.data?.message || error.message));
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    };
    loadChatHistory();
  }, [selectedContact, token]);

  const handleSendMessage = useCallback((message) => {
    console.log('Sending message:', message);
    setMessages((prev) => {
      if (!message.content && !message.type) {
        return prev.map((msg) =>
          msg.id === message.id
            ? { ...msg, ...message }
            : msg
        );
      }

      const deletedMessageIds = JSON.parse(localStorage.getItem('deletedMessageIds') || '[]');
      if (message.id && deletedMessageIds.includes(message.id)) {
        return prev;
      }

      return [...prev, message];
    });
  }, []);

  const handleProfileOpen = useCallback((user) => {
    setSelectedProfile(user);
    setProfileOpen(true);
  }, []);

  const handleProfileClose = useCallback(() => {
    setProfileOpen(false);
    setSelectedProfile(null);
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("userId");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("deletedMessageIds");
    setUserId(null);
    setToken(null);
    setSnackbarMessage("Đăng xuất thành công!");
    setSnackbarSeverity("success");
    setOpenSnackbar(true);
    handleMenuClose();
    navigate("/");
  }, [navigate]);

  const handleToggleAddFriendInput = useCallback(() => {
    setShowAddFriendInput(!showAddFriendInput);
    setFriendPhoneInput("");
  }, [showAddFriendInput]);

  const handleSendFriendRequest = useCallback(async () => {
    if (!friendPhoneInput.trim()) {
      setSnackbarMessage("Vui lòng nhập số điện thoại!");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    if (!/^\d+$/.test(friendPhoneInput)) {
      setSnackbarMessage("Số điện thoại chỉ được chứa các chữ số!");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    if (!token) {
      setSnackbarMessage("Vui lòng đăng nhập để gửi lời mời kết bạn!");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendFriendRequest(friendPhoneInput);
      if (result) {
        setSnackbarMessage("Gửi lời mời kết bạn thành công!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        setShowAddFriendInput(false);
        setFriendPhoneInput("");
        await updateFriendsList();
        await updatePendingRequests();
      } else {
        setSnackbarMessage("Gửi lời mời kết bạn thất bại!");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("Lỗi gửi lời mời kết bạn: " + (error.message || "Không xác định"));
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  }, [friendPhoneInput, updateFriendsList, updatePendingRequests, token]);

  const handleAcceptFriendRequest = useCallback(async (requestId) => {
    if (!token) {
      setSnackbarMessage("Vui lòng đăng nhập để chấp nhận lời mời kết bạn!");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await acceptFriendRequest(requestId);
      if (result) {
        setSnackbarMessage("Đã chấp nhận lời mời kết bạn!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        await updateFriendsList();
        await updatePendingRequests();
      } else {
        setSnackbarMessage("Chấp nhận lời mời thất bại!");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("Lỗi chấp nhận lời mời: " + (error.message || "Không xác định"));
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  }, [updateFriendsList, updatePendingRequests, token]);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMemberIds.length === 0) {
      setSnackbarMessage('Vui lòng nhập tên nhóm và chọn ít nhất một thành viên!');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    if (!token) {
      setSnackbarMessage('Vui lòng đăng nhập để tạo nhóm!');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const userId = localStorage.getItem('userId') || '680e6d95a73e35151128bf65';
    const finalMemberIds = [...new Set([...selectedMemberIds, userId])];

    setIsLoading(true);
    try {
      console.log('Creating group with:', { groupName, memberIds: finalMemberIds, token });
      const result = await createGroup(groupName, finalMemberIds, groupAvatar, token);
      if (result) {
        setSnackbarMessage('Tạo nhóm thành công!');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        setCreateGroupOpen(false);
        setGroupName('');
        setSelectedMemberIds([]);
        await updateGroups();
      } else {
        setSnackbarMessage('Tạo nhóm thất bại!');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage('Lỗi tạo nhóm: ' + (error.response?.data?.message || error.message));
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateGroup = () => {
    setCreateGroupOpen(true);
    handleMenuClose();
  };

  const chatWindowProps = useMemo(() => ({
    selectedContact,
    messages,
    messageInput,
    onMessageInputChange: (e) => setMessageInput(e.target.value),
    onSendMessage: handleSendMessage,
    onProfileOpen: handleProfileOpen,
    userId,
    contacts,
    token,
  }), [selectedContact, messages, messageInput, handleSendMessage, handleProfileOpen, userId, contacts, token]);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={zaloTheme}>
        <CssBaseline />
        <RootContainer>
          <NavSidebar
            userProfile={userProfile}
            currentView={currentView}
            onViewChange={setCurrentView}
            onProfileOpen={() => handleProfileOpen({ id: userId, name: userProfile?.name || "User" })}
            onLogout={handleLogout}
            onOpenChangePasswordModal={() => setOpenChangePasswordModal(true)}
          />
          <SidebarContainer>
            <Box p={2} display="flex" flexDirection="column">
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">
                  {currentView === "messages"
                    ? "Zalo Mess"
                    : currentView === "contacts"
                      ? "Contacts"
                      : "Settings"}
                </Typography>
                <Box>                  <IconButton onClick={() => setUserSearchOpen(true)} sx={{ mr: 1 }} disabled={isLoading}>
                  <BiSearch title="Tìm kiếm" />
                </IconButton>
                  <IconButton onClick={handleMenuOpen} sx={{ mr: 1 }} disabled={isLoading}>
                    <BiGroup title="Create Group" />
                  </IconButton>
                </Box>
              </Box>
            </Box>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { setUserSearchOpen(true); handleMenuClose(); }}>Tìm kiếm bạn bè</MenuItem>
              <MenuItem onClick={handleOpenCreateGroup}>Tạo nhóm</MenuItem>
            </Menu>
            <Snackbar
              open={openSnackbar}
              autoHideDuration={2000}
              onClose={() => setOpenSnackbar(false)}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
              <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>
                {snackbarMessage}
              </Alert>
            </Snackbar>
            {currentView === "messages" && (
              <ContactList
                contacts={contacts}
                selectedContact={selectedContact}
                onContactSelect={setSelectedContact}
                pendingRequests={pendingRequests}
                onAcceptFriendRequest={handleAcceptFriendRequest}
                isLoading={isLoading}
                fetchPendingFriendRequests={fetchPendingFriendRequests}
              />
            )}
            {currentView === "contacts" && (
              <ContactList
                contacts={contacts}
                selectedContact={selectedContact}
                onContactSelect={setSelectedContact}
                pendingRequests={pendingRequests}
                onAcceptFriendRequest={handleAcceptFriendRequest}
                isLoading={isLoading}
                fetchPendingFriendRequests={fetchPendingFriendRequests}
              />
            )}
            <SettingsPanel open={openChangePasswordModal} onClose={() => setOpenChangePasswordModal(false)} />
          </SidebarContainer>
          {token ? (
            <ChatWindow {...chatWindowProps} />
          ) : (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
              <Typography variant="h6" color="text.secondary">
                Vui lòng đăng nhập để sử dụng chức năng chat
              </Typography>
            </Box>
          )}<ProfileModal
            open={profileOpen}
            onClose={handleProfileClose}
            profileData={selectedProfile}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            sx={{ backgroundColor: "#0068ff" }}
            
          />
          <UserSearchModal
            open={userSearchOpen}
            onClose={() => setUserSearchOpen(false)}
            
          />
          
          <Dialog 
            open={createGroupOpen} 
            onClose={() => setCreateGroupOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ 
              textAlign: 'center', 
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'primary.main',
              pb: 2
            }}>
              Tạo nhóm mới
            </DialogTitle>
            <DialogContent>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                mb: 3
              }}>
                <Avatar
                  src={groupAvatar || "https://th.bing.com/th/id/R.0fb6fad84621ac768796c2c228858678?rik=EZHn72rbvK8jkg&pid=ImgRaw&r=0"}
                  sx={{
                    width: 100,
                    height: 100,
                    mb: 2,
                    border: "3px solid",
                    borderColor: "primary.main",
                    boxShadow: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}
                  onClick={() => document.getElementById('groupAvatarInput').click()}
                >
                  <BiGroup size={40} />
                </Avatar>
                <input
                  id="groupAvatarInput"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setGroupAvatar(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  Nhấn để thay đổi ảnh nhóm
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Tên nhóm"
                variant="outlined"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />

              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 2,
                  fontWeight: 'medium',
                  color: 'text.primary'
                }}
              >
                Chọn thành viên
              </Typography>

              <List sx={{ 
                maxHeight: 300, 
                overflow: 'auto',
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                {contacts
                  .filter(contact => !contact.isGroup)
                  .map(contact => (
                    <ListItem 
                      key={contact.id}
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': {
                          borderBottom: 'none'
                        },
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <Checkbox
                        checked={selectedMemberIds.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMemberIds(prev => [...prev, contact.id]);
                          } else {
                            setSelectedMemberIds(prev => prev.filter(id => id !== contact.id));
                          }
                        }}
                        sx={{
                          color: 'primary.main',
                          '&.Mui-checked': {
                            color: 'primary.main',
                          },
                        }}
                      />
                      <ListItemAvatar>
                        <Avatar 
                          src={contact.avatar}
                          sx={{ width: 40, height: 40 }}
                        />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={contact.name}
                        secondary={`@${contact.username}`}
                        primaryTypographyProps={{
                          fontWeight: 'medium'
                        }}
                      />
                    </ListItem>
                  ))}
              </List>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button 
                onClick={() => setCreateGroupOpen(false)}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
              >
                Hủy
              </Button>
              <Button 
                onClick={handleCreateGroup} 
                disabled={isLoading}
                variant="contained"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
              >
                {isLoading ? 'Đang tạo...' : 'Tạo nhóm'}
              </Button>
            </DialogActions>
          </Dialog>
        </RootContainer>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default Home;