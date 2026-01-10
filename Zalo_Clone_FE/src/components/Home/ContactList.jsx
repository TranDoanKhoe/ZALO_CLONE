import React from 'react';
import {
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Badge,
    Typography,
    Button,
    Box,
} from '@mui/material';
import { BiGroup, BiBell, BiPin } from 'react-icons/bi';
import { cancelFriendRequest } from '../../api/user';
import ProfileModal from './ProfileModal';
import { toast } from 'react-toastify';

const ContactList = ({
    contacts,
    selectedContact,
    onContactSelect,
    pendingRequests,
    onAcceptFriendRequest,
    isLoading,
    fetchPendingFriendRequests,
}) => {
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    const handleCancelRequest = async (requestId) => {
        try {
            const result = await cancelFriendRequest(requestId);
            if (result) {
                toast.dismiss();
                toast.success(result.message || 'Đã hủy lời mời kết bạn ');
                await fetchPendingFriendRequests();
            }
        } catch (error) {
            toast.dismiss();
            toast.error(error.message || 'Hủy lời mời kết bạn thất bại');
        }
    };

    return (
        <>
            {pendingRequests?.length > 0 && (
                <>
                    <Typography
                        variant="h6"
                        sx={{ px: 2, mb: 2, fontWeight: 'bold' }}
                    >
                        Lời mời kết bạn ({pendingRequests.length})
                    </Typography>
                    <List sx={{ overflow: 'auto', mb: 3 }}>
                        {pendingRequests.map((request) => (
                            <ListItem
                                key={request.id}
                                sx={{
                                    py: 1.5,
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        width: '100%',
                                        alignItems: 'center',
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar
                                            src={request.avatar}
                                            sx={{ width: 56, height: 56 }}
                                        />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            request.name || request.lastName
                                        }
                                        secondary="Đã gửi lời mời kết bạn"
                                        primaryTypographyProps={{
                                            variant: 'h6',
                                            sx: { fontSize: '1.1rem' },
                                        }}
                                        secondaryTypographyProps={{
                                            variant: 'body2',
                                            sx: { fontSize: '0.95rem' },
                                        }}
                                    />
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 1,
                                        ml: 9,
                                        mt: 1,
                                    }}
                                >
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        onClick={() =>
                                            onAcceptFriendRequest(
                                                request.requestId,
                                            )
                                        }
                                        disabled={isLoading}
                                        sx={{
                                            fontSize: '0.8rem',
                                            py: 0.5,
                                            px: 1,
                                        }}
                                    >
                                        Chấp nhận
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        size="small"
                                        onClick={() =>
                                            handleCancelRequest(
                                                request.requestId,
                                            )
                                        }
                                        disabled={isLoading}
                                        sx={{
                                            fontSize: '0.8rem',
                                            py: 0.5,
                                            px: 1,
                                        }}
                                    >
                                        Từ chối
                                    </Button>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </>
            )}

            <Typography variant="h6" sx={{ px: 2, mb: 2, fontWeight: 'bold' }}>
                Danh sách nhóm và bạn bè
            </Typography>
            <List sx={{ overflow: 'auto', flex: 1 }}>
                {contacts.map((contact) => (
                    <ListItem
                        key={contact.id}
                        component="button"
                        selected={selectedContact?.id === contact.id}
                        onClick={() => onContactSelect(contact)}
                        sx={{
                            py: 1.5,
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                            border: 'none',
                            background: 'transparent',
                            width: '100%',
                            cursor: 'pointer',
                        }}
                    >
                        <ListItemAvatar>
                            <Badge
                                overlap="circular"
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                variant="dot"
                                color={
                                    contact.isGroup
                                        ? 'default'
                                        : contact.status === 'online'
                                        ? 'success'
                                        : 'error'
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
                                    {contact.isGroup && !contact.avatar && (
                                        <BiGroup fontSize={30} />
                                    )}
                                </Avatar>
                            </Badge>
                        </ListItemAvatar>

                        <ListItemText
                            primary={
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                    }}
                                >
                                    {contact.isPinned && (
                                        <BiPin size={16} color="#0091ff" />
                                    )}
                                    <Typography
                                        component="span"
                                        variant="body1"
                                        sx={{
                                            fontSize: '1rem',
                                            fontWeight:
                                                contact.unreadCount > 0
                                                    ? '700'
                                                    : '500',
                                        }}
                                    >
                                        {contact.isGroup
                                            ? `[Nhóm] ${contact.name}`
                                            : `${contact.username}`}
                                    </Typography>
                                    {contact.isMuted && (
                                        <BiBell
                                            size={16}
                                            color="#999"
                                            style={{ opacity: 0.6 }}
                                        />
                                    )}
                                </Box>
                            }
                            secondary={
                                contact.lastMessage || 'Chưa có tin nhắn'
                            }
                            sx={{ ml: 2 }}
                            primaryTypographyProps={{
                                component: 'div',
                                variant: 'body1',
                                sx: {
                                    fontSize: '1rem',
                                    mb: 0.5,
                                },
                            }}
                            secondaryTypographyProps={{
                                variant: 'body2',
                                noWrap: true,
                                sx: {
                                    fontSize: '0.875rem',
                                    color:
                                        contact.unreadCount > 0
                                            ? 'text.primary'
                                            : 'text.secondary',
                                    fontWeight:
                                        contact.unreadCount > 0
                                            ? '600'
                                            : 'normal',
                                },
                            }}
                        />
                        {contact.unreadCount > 0 && (
                            <Box
                                sx={{
                                    bgcolor: '#0084ff',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: 20,
                                    height: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    ml: 1,
                                }}
                            >
                                {contact.unreadCount}
                            </Box>
                        )}
                    </ListItem>
                ))}
            </List>

            <ProfileModal
                userId={userId}
                token={token}
                contacts={contacts}
                onContactSelect={onContactSelect}
            />
        </>
    );
};

export default ContactList;
