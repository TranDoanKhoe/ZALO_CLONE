import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    IconButton,
    Divider,
    styled,
    Chip,
} from '@mui/material';
import { BiUserPlus, BiPhone, BiVideo, BiChat } from 'react-icons/bi';

const Container = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#fff',
});

const Header = styled(Box)({
    padding: '16px 20px',
    borderBottom: '1px solid #e0e0e0',
});

const FriendListContainer = styled(Box)({
    flex: 1,
    overflowY: 'auto',
});

const StyledListItem = styled(ListItem)({
    cursor: 'pointer',
    '&:hover': {
        backgroundColor: '#f5f5f5',
    },
    padding: '12px 20px',
});

const ActionButtons = styled(Box)({
    display: 'flex',
    gap: '8px',
});

const FriendsList = ({
    contacts,
    onSelectContact,
    onOpenUserSearch,
    onStartCall,
}) => {
    // Filter only friends (not groups)
    const friends = contacts.filter((contact) => !contact.isGroup);

    const handleFriendClick = (friend) => {
        if (onSelectContact) {
            onSelectContact(friend);
        }
    };

    const handleStartCall = (friend, isVideo) => {
        // Select friend first, then trigger call
        if (onSelectContact) {
            onSelectContact(friend);
        }
        if (onStartCall) {
            // Wait a bit for selection to process
            setTimeout(() => {
                onStartCall(friend, isVideo);
            }, 100);
        }
    };

    return (
        <Container>
            <Header>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Typography variant="h6" fontWeight={600}>
                        Danh sách bạn bè
                    </Typography>
                </Box>

                <Box
                    sx={{
                        mt: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        {friends.length} bạn bè
                    </Typography>
                </Box>
            </Header>

            <FriendListContainer>
                {friends.length === 0 ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'text.secondary',
                        }}
                    >
                        <BiUserPlus size={64} color="#ccc" />
                        <Typography variant="body1" sx={{ mt: 2 }}>
                            Chưa có bạn bè
                        </Typography>
                        <Typography
                            variant="body2"
                            color="primary"
                            sx={{
                                mt: 1,
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'underline' },
                            }}
                            onClick={onOpenUserSearch}
                        >
                            Thêm bạn bè ngay
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {friends.map((friend) => (
                            <React.Fragment key={friend.id}>
                                <StyledListItem>
                                    <ListItemAvatar>
                                        <Avatar
                                            src={friend.avatar}
                                            sx={{ width: 56, height: 56 }}
                                        >
                                            {friend.name?.charAt(0)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography
                                                variant="body1"
                                                fontWeight={500}
                                            >
                                                {friend.name}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    mt: 0.5,
                                                }}
                                            >
                                                {friend.status === 'online' ? (
                                                    <Chip
                                                        label="Đang hoạt động"
                                                        size="small"
                                                        sx={{
                                                            height: '20px',
                                                            fontSize: '11px',
                                                            backgroundColor:
                                                                '#e7f3ff',
                                                            color: '#0068ff',
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        component="span"
                                                    >
                                                        {friend.lastSeen
                                                            ? `Hoạt động ${new Date(
                                                                  friend.lastSeen,
                                                              ).toLocaleDateString()}`
                                                            : 'Không hoạt động'}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                        secondaryTypographyProps={{
                                            component: 'div',
                                        }}
                                    />
                                    <ActionButtons>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFriendClick(friend);
                                            }}
                                            sx={{
                                                backgroundColor: '#f0f2f5',
                                                '&:hover': {
                                                    backgroundColor: '#e4e6eb',
                                                },
                                            }}
                                        >
                                            <BiChat size={18} />
                                        </IconButton>
                                        {!friend.isGroup && (
                                            <>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStartCall(
                                                            friend,
                                                            false,
                                                        );
                                                    }}
                                                    sx={{
                                                        backgroundColor:
                                                            '#f0f2f5',
                                                        '&:hover': {
                                                            backgroundColor:
                                                                '#e4e6eb',
                                                        },
                                                    }}
                                                    title="Gọi thoại"
                                                >
                                                    <BiPhone size={18} />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStartCall(
                                                            friend,
                                                            true,
                                                        );
                                                    }}
                                                    sx={{
                                                        backgroundColor:
                                                            '#f0f2f5',
                                                        '&:hover': {
                                                            backgroundColor:
                                                                '#e4e6eb',
                                                        },
                                                    }}
                                                    title="Gọi video"
                                                >
                                                    <BiVideo size={18} />
                                                </IconButton>
                                            </>
                                        )}
                                    </ActionButtons>
                                </StyledListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </FriendListContainer>
        </Container>
    );
};

export default FriendsList;
