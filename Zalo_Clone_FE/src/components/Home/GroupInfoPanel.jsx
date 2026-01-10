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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Checkbox,
    Radio,
    RadioGroup,
    FormControlLabel,
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
    contacts = [],
    onAddMembers,
    onUpdateGroupInfo,
    onPinConversation,
    onMuteConversation,
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
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [selectedNewMembers, setSelectedNewMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [editNameOpen, setEditNameOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupAvatar, setNewGroupAvatar] = useState(null);
    const [isPinned, setIsPinned] = useState(
        selectedContact?.isPinned || false,
    );
    const [isMuted, setIsMuted] = useState(selectedContact?.isMuted || false);
    const [muteDialogOpen, setMuteDialogOpen] = useState(false);
    const [selectedMuteOption, setSelectedMuteOption] = useState('1hour');

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

    const handleOpenAddMember = () => {
        setAddMemberOpen(true);
        setSelectedNewMembers([]);
        setSearchQuery('');
    };

    const handleCloseAddMember = () => {
        setAddMemberOpen(false);
        setSelectedNewMembers([]);
        setSearchQuery('');
    };

    const handleToggleNewMember = (memberId) => {
        setSelectedNewMembers((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId],
        );
    };

    const handleAddMembers = async () => {
        if (selectedNewMembers.length === 0) {
            return;
        }

        if (onAddMembers) {
            await onAddMembers(selectedContact.id, selectedNewMembers);
        }
        handleCloseAddMember();
    };

    // Lọc ra những người bạn chưa ở trong nhóm
    const existingMemberIds = new Set(groupMembers.map((m) => m.id));
    const availableContacts = contacts.filter(
        (contact) =>
            !contact.isGroup &&
            !existingMemberIds.has(contact.id) &&
            (contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contact.phone?.includes(searchQuery)),
    );

    const handleOpenEditName = () => {
        setNewGroupName(selectedContact?.name || '');
        setEditNameOpen(true);
    };

    const handleCloseEditName = () => {
        setEditNameOpen(false);
        setNewGroupName('');
    };

    const handleUpdateGroupName = async () => {
        if (!newGroupName.trim()) return;

        if (onUpdateGroupInfo) {
            await onUpdateGroupInfo(selectedContact.id, { name: newGroupName });
        }
        handleCloseEditName();
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const avatarBase64 = reader.result;
            setNewGroupAvatar(avatarBase64);

            if (onUpdateGroupInfo) {
                await onUpdateGroupInfo(selectedContact.id, {
                    avatarGroup: avatarBase64,
                });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleTogglePin = async () => {
        if (onPinConversation) {
            await onPinConversation(selectedContact.id, !isPinned);
            setIsPinned(!isPinned);
        }
    };

    const handleToggleMute = async () => {
        if (isMuted) {
            // Nếu đang mắt, bật lại ngay
            if (onMuteConversation) {
                await onMuteConversation(selectedContact.id, false, null);
                setIsMuted(false);
            }
        } else {
            // Nếu chưa mắt, mở dialog chọn thời gian
            setMuteDialogOpen(true);
        }
    };

    const handleCloseMuteDialog = () => {
        setMuteDialogOpen(false);
    };

    const handleConfirmMute = async () => {
        if (onMuteConversation) {
            await onMuteConversation(
                selectedContact.id,
                true,
                selectedMuteOption,
            );
            setIsMuted(true);
        }
        setMuteDialogOpen(false);
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
                        src={newGroupAvatar || selectedContact?.avatar}
                        sx={{
                            width: 80,
                            height: 80,
                            mb: 2,
                            cursor: 'pointer',
                            '&:hover': {
                                opacity: 0.8,
                            },
                        }}
                        onClick={() =>
                            document
                                .getElementById('groupAvatarChangeInput')
                                .click()
                        }
                    >
                        {selectedContact?.name?.charAt(0)}
                    </Avatar>
                    <input
                        id="groupAvatarChangeInput"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarChange}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {selectedContact?.name}
                    </Typography>
                    <IconButton size="small" onClick={handleOpenEditName}>
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
                        onClick={handleToggleMute}
                    >
                        <IconButton>
                            <BiBell
                                size={24}
                                color={isMuted ? '#999' : '#000'}
                            />
                        </IconButton>
                        <Typography
                            variant="caption"
                            sx={{ color: isMuted ? '#999' : '#000' }}
                        >
                            {isMuted ? 'Đã tắt thông báo' : 'Tắt thông báo'}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                        }}
                        onClick={handleTogglePin}
                    >
                        <IconButton>
                            <BiPin
                                size={24}
                                color={isPinned ? '#0091ff' : '#000'}
                            />
                        </IconButton>
                        <Typography
                            variant="caption"
                            sx={{ color: isPinned ? '#0091ff' : '#000' }}
                        >
                            {isPinned ? 'Đã ghim' : 'Ghim hội thoại'}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                        }}
                        onClick={handleOpenAddMember}
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

            {/* Dialog đổi tên nhóm */}
            <Dialog
                open={editNameOpen}
                onClose={handleCloseEditName}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Đổi tên nhóm</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Tên nhóm mới"
                        variant="outlined"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditName}>Hủy</Button>
                    <Button
                        onClick={handleUpdateGroupName}
                        variant="contained"
                        disabled={!newGroupName.trim()}
                    >
                        Lưu
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog thêm thành viên */}
            <Dialog
                open={addMemberOpen}
                onClose={handleCloseAddMember}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle
                    sx={{
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'primary.main',
                        pb: 2,
                    }}
                >
                    Thêm thành viên vào nhóm
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Tìm kiếm bạn bè..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ mb: 2 }}
                    />

                    <Typography
                        variant="subtitle1"
                        sx={{
                            mb: 1,
                            fontWeight: 'medium',
                            color: 'text.primary',
                        }}
                    >
                        Đã chọn: {selectedNewMembers.length} người
                    </Typography>

                    <List
                        sx={{
                            maxHeight: 400,
                            overflow: 'auto',
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        {availableContacts.length === 0 ? (
                            <ListItem>
                                <ListItemText
                                    primary={
                                        searchQuery
                                            ? 'Không tìm thấy bạn bè phù hợp'
                                            : 'Tất cả bạn bè đã ở trong nhóm'
                                    }
                                    sx={{
                                        textAlign: 'center',
                                        color: 'text.secondary',
                                    }}
                                />
                            </ListItem>
                        ) : (
                            availableContacts.map((contact) => (
                                <ListItem
                                    key={contact.id}
                                    sx={{
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                        '&:last-child': {
                                            borderBottom: 'none',
                                        },
                                        '&:hover': {
                                            bgcolor: 'action.hover',
                                        },
                                    }}
                                >
                                    <Checkbox
                                        checked={selectedNewMembers.includes(
                                            contact.id,
                                        )}
                                        onChange={() =>
                                            handleToggleNewMember(contact.id)
                                        }
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
                                        secondary={
                                            contact.phone || contact.username
                                        }
                                        primaryTypographyProps={{
                                            fontWeight: 'medium',
                                        }}
                                    />
                                </ListItem>
                            ))
                        )}
                    </List>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={handleCloseAddMember}
                        variant="outlined"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 3,
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleAddMembers}
                        disabled={selectedNewMembers.length === 0}
                        variant="contained"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 3,
                        }}
                    >
                        Thêm thành viên
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog tắt thông báo */}
            <Dialog
                open={muteDialogOpen}
                onClose={handleCloseMuteDialog}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Xác nhận</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>
                        Bạn có chắc muốn tắt thông báo hội thoại này:
                    </Typography>
                    <RadioGroup
                        value={selectedMuteOption}
                        onChange={(e) => setSelectedMuteOption(e.target.value)}
                    >
                        <FormControlLabel
                            value="1hour"
                            control={<Radio />}
                            label="Trong 1 giờ"
                        />
                        <FormControlLabel
                            value="4hours"
                            control={<Radio />}
                            label="Trong 4 giờ"
                        />
                        <FormControlLabel
                            value="until8am"
                            control={<Radio />}
                            label="Cho đến 8:00 AM"
                        />
                        <FormControlLabel
                            value="forever"
                            control={<Radio />}
                            label="Cho đến khi được mở lại"
                        />
                    </RadioGroup>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseMuteDialog}>Hủy</Button>
                    <Button onClick={handleConfirmMute} variant="contained">
                        Đồng ý
                    </Button>
                </DialogActions>
            </Dialog>
        </PanelContainer>
    );
};

export default GroupInfoPanel;
