import React, { useState } from "react";
import {
  List, ListItem, ListItemAvatar, ListItemText, Avatar, Badge, TextField,
  InputAdornment, Typography, Button, Box
} from "@mui/material";
import { BiSearch, BiGroup } from "react-icons/bi";
import { fetchFriendsList, cancelFriendRequest } from "../../api/user";
import ProfileModal from "./ProfileModal";
import { toast } from "react-toastify";

const ContactList = ({
  contacts,
  selectedContact,
  onContactSelect,
  pendingRequests,
  onAcceptFriendRequest,
  isLoading,
  fetchPendingFriendRequests,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const token = localStorage.getItem("accessToken");
  const userId = localStorage.getItem("userId");

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCancelRequest = async (requestId) => {
    try {
      const result = await cancelFriendRequest(requestId);
      if (result) {
        toast.dismiss();
        toast.success(result.message || "Đã hủy lời mời kết bạn ");
        await fetchPendingFriendRequests();
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || "Hủy lời mời kết bạn thất bại");
    }
  };

  return (
    <>
      <TextField
        fullWidth
        placeholder="Tìm kiếm"
        variant="outlined"
        size="medium"
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            fontSize: '1.1rem',
            height: '50px'
          }
        }}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <BiSearch fontSize={35} />
            </InputAdornment>
          ),
        }}
      />

      {pendingRequests?.length > 0 && (
        <>
          <Typography variant="h6" sx={{ px: 2, mb: 2, fontWeight: "bold" }}>
            Lời mời kết bạn ({pendingRequests.length})
          </Typography>
          <List sx={{ overflow: "auto", mb: 3 }}>
            {pendingRequests.map((request) => (
              <ListItem
                key={request.id}
                sx={{ py: 1.5, flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                  <ListItemAvatar>
                    <Avatar
                      src={request.avatar}
                      sx={{ width: 56, height: 56 }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={request.name || request.lastName}
                    secondary="Đã gửi lời mời kết bạn"
                    primaryTypographyProps={{
                      variant: 'h6',
                      sx: { fontSize: '1.1rem' }
                    }}
                    secondaryTypographyProps={{
                      variant: 'body2',
                      sx: { fontSize: '0.95rem' }
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, ml: 9, mt: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => onAcceptFriendRequest(request.requestId)}
                    disabled={isLoading}
                    sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}
                  >
                    Chấp nhận
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => handleCancelRequest(request.requestId)}
                    disabled={isLoading}
                    sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}
                  >
                    Từ chối
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        </>
      )}

      <Typography variant="h6" sx={{ px: 2, mb: 2, fontWeight: "bold" }}>
        Danh sách nhóm và bạn bè
      </Typography>
      <List sx={{ overflow: "auto", flex: 1 }}>
        {filteredContacts.map((contact) => (
          <ListItem
            key={contact.id}
            component="button"
            selected={selectedContact?.id === contact.id}
            onClick={() => onContactSelect(contact)}
            sx={{
              py: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              },
              border: 'none',
              background: 'transparent',
              width: '100%',
              cursor: 'pointer'
            }}
          >
            <ListItemAvatar>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                variant="dot"
                color={
                  contact.isGroup
                    ? "default"
                    : contact.status === "online"
                      ? "success"
                      : "error"
                }
                sx={{
                  '& .MuiBadge-badge': {
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                  },
                }}
              >
                <Avatar
                  src={contact.avatar}
                  sx={{ width: 56, height: 56 }}
                >
                  {contact.isGroup && !contact.avatar && <BiGroup fontSize={30} />}
                </Avatar>
              </Badge>
            </ListItemAvatar>


            <ListItemText
              primary={contact.isGroup ? `[Nhóm] ${contact.name}` : `${contact.username}`}
              secondary={contact.lastMessage || "Chưa có tin nhắn"}
              primaryTypographyProps={{
                variant: 'h6',
                sx: { fontSize: '1.1rem', fontWeight: 'medium' }
              }}
              secondaryTypographyProps={{
                variant: 'body2',
                noWrap: true,
                sx: {
                  fontSize: '0.95rem',
                  color: contact.lastMessage ? 'text.primary' : 'text.secondary',
                  fontWeight: contact.lastMessage ? 'medium' : 'normal'
                }
              }}
            />
          </ListItem>
        ))}
      </List>

      <ProfileModal
        userId={userId}
        token={token}
        contacts={contacts}
        onContactSelect={onContactSelect}
        fetchFriendsList={fetchFriendsList}
      />
    </>
  );
};

export default ContactList;
