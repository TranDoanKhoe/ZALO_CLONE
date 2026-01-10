import React, { useState } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    Collapse,
    Switch,
    styled,
    Badge,
} from '@mui/material';
import {
    BiX,
    BiChevronDown,
    BiChevronUp,
    BiBell,
    BiGroup,
    BiPin,
    BiUserPlus,
    BiSearch,
    BiCog,
    BiImage,
    BiFile,
    BiLink,
    BiShieldAlt2,
    BiLockAlt,
    BiShow,
    BiMessageAltError,
    BiLogOut,
    BiEdit,
} from 'react-icons/bi';

const PanelContainer = styled(Box)(({ theme }) => ({
    width: '360px',
    height: '100%',
    backgroundColor: '#fff',
    borderLeft: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
}));

const PanelHeader = styled(Box)(({ theme }) => ({
    padding: '16px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
}));

const ScrollableContent = styled(Box)(({ theme }) => ({
    flex: 1,
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
        width: '6px',
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: '#ccc',
        borderRadius: '3px',
    },
}));

const SectionHeader = styled(Box)(({ theme }) => ({
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    '&:hover': {
        backgroundColor: '#f5f5f5',
    },
}));

const ActionButton = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    cursor: 'pointer',
    '&:hover': {
        backgroundColor: '#f5f5f5',
    },
}));

const GroupInfoPanel = ({
    selectedContact,
    groupMembers = [],
    messages = [],
    onClose,
}) => {
    const [expandedSections, setExpandedSections] = useState({
        members: true,
        schedule: false,
        media: false,
        files: false,
        links: false,
        security: false,
    });

    const [isPrivateMode, setIsPrivateMode] = useState(false);

    // Lọc ảnh và video
    const mediaMessages = messages.filter(
        (msg) => msg.type === 'IMAGE' || msg.type === 'VIDEO',
    );

    // Lọc file
    const fileMessages = messages.filter((msg) => msg.type === 'FILE');

    // Lọc link (tin nhắn text có chứa http/https)
    const linkMessages = messages.filter(
        (msg) =>
            msg.type === 'TEXT' &&
            msg.content &&
            (msg.content.includes('http://') ||
                msg.content.includes('https://')),
    );

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleTogglePrivateMode = () => {
        setIsPrivateMode(!isPrivateMode);
    };

    return (
        <PanelContainer>
            {/* Header */}
            <PanelHeader>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Thông tin nhóm
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <BiX size={24} />
                </IconButton>
            </PanelHeader>

            <ScrollableContent>
                {/* Group Avatar & Name */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '24px 16px',
                        borderBottom: '1px solid #e0e0e0',
                    }}
                >
                    <Avatar
                        src={selectedContact?.avatar}
                        sx={{
                            width: 80,
                            height: 80,
                            mb: 2,
                        }}
                    >
                        {selectedContact?.name?.charAt(0)}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {selectedContact?.name}
                    </Typography>
                    <IconButton size="small">
                        <BiEdit size={18} />
                    </IconButton>
                </Box>

                {/* Quick Actions */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        padding: '16px',
                        borderBottom: '8px solid #f5f5f5',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <IconButton>
                            <BiBell size={24} />
                        </IconButton>
                        <Typography variant="caption">Tắt thông báo</Typography>
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <IconButton>
                            <BiPin size={24} />
                        </IconButton>
                        <Typography variant="caption">
                            Ghim hội thoại
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <IconButton>
                            <BiUserPlus size={24} />
                        </IconButton>
                        <Typography variant="caption">
                            Thêm thành viên
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <IconButton>
                            <BiCog size={24} />
                        </IconButton>
                        <Typography variant="caption">Quản lý nhóm</Typography>
                    </Box>
                </Box>

                {/* Members Section */}
                <Box>
                    <SectionHeader onClick={() => toggleSection('members')}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <BiGroup size={20} />
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: 500 }}
                            >
                                Thành viên nhóm
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                {groupMembers.length} thành viên
                            </Typography>
                            {expandedSections.members ? (
                                <BiChevronUp size={20} />
                            ) : (
                                <BiChevronDown size={20} />
                            )}
                        </Box>
                    </SectionHeader>
                    <Collapse in={expandedSections.members}>
                        <List sx={{ maxHeight: '200px', overflow: 'auto' }}>
                            {groupMembers.length > 0 ? (
                                <>
                                    {groupMembers
                                        .slice(0, 5)
                                        .map((member, index) => (
                                            <ListItem key={member.id || index}>
                                                <ListItemAvatar>
                                                    <Badge
                                                        overlap="circular"
                                                        anchorOrigin={{
                                                            vertical: 'bottom',
                                                            horizontal: 'right',
                                                        }}
                                                        variant="dot"
                                                        sx={{
                                                            '& .MuiBadge-badge':
                                                                {
                                                                    backgroundColor:
                                                                        member.status ===
                                                                        'online'
                                                                            ? '#44b700'
                                                                            : '#bbb',
                                                                    color:
                                                                        member.status ===
                                                                        'online'
                                                                            ? '#44b700'
                                                                            : '#bbb',
                                                                },
                                                        }}
                                                    >
                                                        <Avatar
                                                            src={member.avatar}
                                                            alt={
                                                                member.username
                                                            }
                                                        >
                                                            {member.username?.charAt(
                                                                0,
                                                            )}
                                                        </Avatar>
                                                    </Badge>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={member.username}
                                                    secondary={
                                                        member.status ===
                                                        'online'
                                                            ? 'Đang hoạt động'
                                                            : ''
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    {groupMembers.length > 5 && (
                                        <ListItem>
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        color="primary"
                                                        sx={{
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        Xem tất cả{' '}
                                                        {groupMembers.length}{' '}
                                                        thành viên
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    )}
                                </>
                            ) : (
                                <ListItem>
                                    <ListItemText
                                        primary={
                                            <Typography
                                                color="text.secondary"
                                                sx={{ textAlign: 'center' }}
                                            >
                                                Không có thành viên nào
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                            )}
                        </List>
                    </Collapse>
                </Box>

                <Divider sx={{ borderColor: '#f5f5f5', borderWidth: '4px' }} />

                {/* Schedule Section */}
                <Box>
                    <SectionHeader onClick={() => toggleSection('schedule')}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <BiSearch size={20} />
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: 500 }}
                            >
                                Bảng tin nhóm
                            </Typography>
                        </Box>
                        {expandedSections.schedule ? (
                            <BiChevronUp size={20} />
                        ) : (
                            <BiChevronDown size={20} />
                        )}
                    </SectionHeader>
                    <Collapse in={expandedSections.schedule}>
                        <Box sx={{ p: 2 }}>
                            <ActionButton>
                                <BiSearch size={20} />
                                <Typography variant="body2">
                                    Danh sách nhạc hẹn
                                </Typography>
                            </ActionButton>
                            <ActionButton>
                                <BiEdit size={20} />
                                <Typography variant="body2">
                                    Ghi chú, ghim, bình chọn
                                </Typography>
                            </ActionButton>
                        </Box>
                    </Collapse>
                </Box>

                <Divider sx={{ borderColor: '#f5f5f5', borderWidth: '4px' }} />

                {/* Media Section */}
                <Box>
                    <SectionHeader onClick={() => toggleSection('media')}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <BiImage size={20} />
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: 500 }}
                            >
                                Ảnh/Video
                            </Typography>
                        </Box>
                        {expandedSections.media ? (
                            <BiChevronUp size={20} />
                        ) : (
                            <BiChevronDown size={20} />
                        )}
                    </SectionHeader>
                    <Collapse in={expandedSections.media}>
                        {mediaMessages.length > 0 ? (
                            <Box
                                sx={{
                                    p: 2,
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 1,
                                }}
                            >
                                {mediaMessages
                                    .slice(0, 12)
                                    .map((msg, index) => (
                                        <Box
                                            key={msg.id || index}
                                            sx={{
                                                aspectRatio: '1',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                '&:hover': { opacity: 0.8 },
                                            }}
                                            onClick={() =>
                                                window.open(
                                                    msg.content,
                                                    '_blank',
                                                )
                                            }
                                        >
                                            {msg.type === 'IMAGE' ? (
                                                <img
                                                    src={msg.content}
                                                    alt="Media"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            ) : (
                                                <video
                                                    src={msg.content}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    ))}
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    p: 2,
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                }}
                            >
                                <Typography variant="body2">
                                    Chưa có Ảnh/Video được chia sẻ sau 7/1/2026
                                </Typography>
                            </Box>
                        )}
                    </Collapse>
                </Box>

                <Divider />

                {/* Files Section */}
                <Box>
                    <SectionHeader onClick={() => toggleSection('files')}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <BiFile size={20} />
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: 500 }}
                            >
                                File
                            </Typography>
                        </Box>
                        {expandedSections.files ? (
                            <BiChevronUp size={20} />
                        ) : (
                            <BiChevronDown size={20} />
                        )}
                    </SectionHeader>
                    <Collapse in={expandedSections.files}>
                        {fileMessages.length > 0 ? (
                            <Box sx={{ px: 2, py: 1 }}>
                                {fileMessages.slice(0, 10).map((msg, index) => (
                                    <ActionButton
                                        key={msg.id || index}
                                        onClick={() =>
                                            window.open(msg.content, '_blank')
                                        }
                                    >
                                        <BiFile size={24} color="#0091ff" />
                                        <Box
                                            sx={{ flex: 1, overflow: 'hidden' }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {msg.fileName ||
                                                    'File đính kèm'}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {new Date(
                                                    msg.createAt,
                                                ).toLocaleDateString('vi-VN')}
                                            </Typography>
                                        </Box>
                                    </ActionButton>
                                ))}
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    p: 2,
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                }}
                            >
                                <Typography variant="body2">
                                    Chưa có File được chia sẻ từ sau 7/1/2026
                                </Typography>
                            </Box>
                        )}
                    </Collapse>
                </Box>

                <Divider />

                {/* Links Section */}
                <Box>
                    <SectionHeader onClick={() => toggleSection('links')}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <BiLink size={20} />
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: 500 }}
                            >
                                Link
                            </Typography>
                        </Box>
                        {expandedSections.links ? (
                            <BiChevronUp size={20} />
                        ) : (
                            <BiChevronDown size={20} />
                        )}
                    </SectionHeader>
                    <Collapse in={expandedSections.links}>
                        {linkMessages.length > 0 ? (
                            <Box sx={{ px: 2, py: 1 }}>
                                {linkMessages.slice(0, 10).map((msg, index) => {
                                    const urlMatch =
                                        msg.content.match(
                                            /(https?:\/\/[^\s]+)/g,
                                        );
                                    const url = urlMatch
                                        ? urlMatch[0]
                                        : msg.content;
                                    return (
                                        <ActionButton
                                            key={msg.id || index}
                                            onClick={() =>
                                                window.open(url, '_blank')
                                            }
                                        >
                                            <BiLink size={24} color="#0091ff" />
                                            <Box
                                                sx={{
                                                    flex: 1,
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        overflow: 'hidden',
                                                        textOverflow:
                                                            'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {url}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {new Date(
                                                        msg.createAt,
                                                    ).toLocaleDateString(
                                                        'vi-VN',
                                                    )}
                                                </Typography>
                                            </Box>
                                        </ActionButton>
                                    );
                                })}
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    p: 2,
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                }}
                            >
                                <Typography variant="body2">
                                    Chưa có Link được chia sẻ từ sau 7/1/2026
                                </Typography>
                            </Box>
                        )}
                    </Collapse>
                </Box>

                <Divider sx={{ borderColor: '#f5f5f5', borderWidth: '4px' }} />

                {/* Security Settings */}
                <Box>
                    <SectionHeader onClick={() => toggleSection('security')}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <BiShieldAlt2 size={20} />
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: 500 }}
                            >
                                Thiết lập bảo mật
                            </Typography>
                        </Box>
                        {expandedSections.security ? (
                            <BiChevronUp size={20} />
                        ) : (
                            <BiChevronDown size={20} />
                        )}
                    </SectionHeader>
                    <Collapse in={expandedSections.security}>
                        <Box sx={{ px: 2, pb: 2 }}>
                            <ActionButton>
                                <BiLockAlt size={20} color="#666" />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2">
                                        Tin nhắn tự xóa
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Chỉ dành cho trưởng hoặc phó nhóm
                                    </Typography>
                                </Box>
                            </ActionButton>
                            <ActionButton>
                                <BiShow size={20} color="#666" />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2">
                                        Ẩn trò chuyện
                                    </Typography>
                                    <Switch
                                        checked={isPrivateMode}
                                        onChange={handleTogglePrivateMode}
                                        size="small"
                                        sx={{ ml: 'auto' }}
                                    />
                                </Box>
                            </ActionButton>
                            <ActionButton>
                                <BiMessageAltError size={20} color="#666" />
                                <Typography variant="body2">Báo xấu</Typography>
                            </ActionButton>
                        </Box>
                    </Collapse>
                </Box>

                <Divider sx={{ borderColor: '#f5f5f5', borderWidth: '4px' }} />

                {/* Leave Group */}
                <ActionButton sx={{ color: 'error.main' }}>
                    <BiLogOut size={20} />
                    <Typography variant="body2">Rời nhóm</Typography>
                </ActionButton>
            </ScrollableContent>
        </PanelContainer>
    );
};

export default GroupInfoPanel;
