import React, { useState } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Avatar,
    Divider,
    Collapse,
    Switch,
    styled,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
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
    BiPin,
    BiUserPlus,
    BiSearch,
    BiImage,
    BiFile,
    BiLink,
    BiShieldAlt2,
    BiLockAlt,
    BiShow,
    BiMessageAltError,
    BiTrash,
    BiGroup,
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

const PersonalChatInfoPanel = ({
    selectedContact,
    messages = [],
    onClose,
    contacts = [],
    onCreateGroup,
    onPinConversation,
    onMuteConversation,
}) => {
    const [expandedSections, setExpandedSections] = useState({
        schedule: false,
        media: false,
        files: false,
        links: false,
        security: false,
    });

    const [isPrivateMode, setIsPrivateMode] = useState(false);
    const [createGroupOpen, setCreateGroupOpen] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [groupAvatar, setGroupAvatar] = useState(null);
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

    const handleOpenCreateGroup = () => {
        setCreateGroupOpen(true);
        setGroupName('');
        setSelectedMembers([selectedContact.id]); // Tự động chọn người đang chat
        setSearchQuery('');
        setGroupAvatar(null);
    };

    const handleCloseCreateGroup = () => {
        setCreateGroupOpen(false);
        setGroupName('');
        setSelectedMembers([]);
        setSearchQuery('');
        setGroupAvatar(null);
    };

    const handleToggleMember = (memberId) => {
        setSelectedMembers((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId],
        );
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedMembers.length === 0) {
            return;
        }

        if (onCreateGroup) {
            await onCreateGroup(groupName, selectedMembers, groupAvatar);
        }
        handleCloseCreateGroup();
    };

    // Lọc contacts để hiển thị trong modal
    const availableContacts = contacts.filter(
        (contact) =>
            !contact.isGroup &&
            contact.id !== selectedContact.id && // Không hiển thị người đang chat
            (contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contact.phone?.includes(searchQuery)),
    );

    return (
        <PanelContainer>
            {/* Header */}
            <PanelHeader>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Thông tin hội thoại
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <BiX size={24} />
                </IconButton>
            </PanelHeader>

            <ScrollableContent>
                {/* User Avatar & Name */}
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
                            sx={{
                                textAlign: 'center',
                                color: isMuted ? '#999' : '#000',
                            }}
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
                            sx={{
                                textAlign: 'center',
                                color: isPinned ? '#0091ff' : '#000',
                            }}
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
                        onClick={handleOpenCreateGroup}
                    >
                        <IconButton>
                            <BiUserPlus size={24} />
                        </IconButton>
                        <Typography
                            variant="caption"
                            sx={{ textAlign: 'center' }}
                        >
                            Tạo nhóm trò chuyện
                        </Typography>
                    </Box>
                </Box>

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
                                Danh sách nhạc hẹn
                            </Typography>
                        </Box>
                        {expandedSections.schedule ? (
                            <BiChevronUp size={20} />
                        ) : (
                            <BiChevronDown size={20} />
                        )}
                    </SectionHeader>
                    <Collapse in={expandedSections.schedule}>
                        <Box
                            sx={{
                                p: 2,
                                textAlign: 'center',
                                color: 'text.secondary',
                            }}
                        >
                            <Typography variant="body2">
                                Chưa có nhạc hẹn nào
                            </Typography>
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
                                        Không báo giữ
                                    </Typography>
                                </Box>
                            </ActionButton>
                            <ActionButton>
                                <BiShow size={20} color="#666" />
                                <Box
                                    sx={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Typography variant="body2">
                                        Ẩn trò chuyện
                                    </Typography>
                                    <Switch
                                        checked={isPrivateMode}
                                        onChange={handleTogglePrivateMode}
                                        size="small"
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

                {/* Delete Chat History */}
                <ActionButton sx={{ color: 'error.main' }}>
                    <BiTrash size={20} />
                    <Typography variant="body2">
                        Xóa lịch sử trò chuyện
                    </Typography>
                </ActionButton>
            </ScrollableContent>

            {/* Dialog tạo nhóm */}
            <Dialog
                open={createGroupOpen}
                onClose={handleCloseCreateGroup}
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
                    Tạo nhóm trò chuyện
                </DialogTitle>
                <DialogContent>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            mb: 3,
                        }}
                    >
                        <Avatar
                            src={
                                groupAvatar ||
                                'https://th.bing.com/th/id/R.0fb6fad84621ac768796c2c228858678?rik=EZHn72rbvK8jkg&pid=ImgRaw&r=0'
                            }
                            sx={{
                                width: 100,
                                height: 100,
                                mb: 2,
                                border: '3px solid',
                                borderColor: 'primary.main',
                                boxShadow: 2,
                                cursor: 'pointer',
                                '&:hover': {
                                    opacity: 0.8,
                                },
                            }}
                            onClick={() =>
                                document
                                    .getElementById('groupAvatarInput')
                                    .click()
                            }
                        >
                            {!groupAvatar && <BiGroup size={40} />}
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
                        placeholder="Nhập tên nhóm..."
                        sx={{ mb: 2 }}
                    />

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
                        Thành viên đã chọn: {selectedMembers.length + 1}
                    </Typography>

                    {/* Hiển thị người đang chat (đã chọn mặc định) */}
                    <Box
                        sx={{
                            mb: 2,
                            p: 1,
                            bgcolor: '#f0f2f5',
                            borderRadius: 1,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Avatar
                                src={selectedContact.avatar}
                                sx={{ width: 32, height: 32 }}
                            />
                            <Typography variant="body2">
                                {selectedContact.name} (đang chat)
                            </Typography>
                        </Box>
                    </Box>

                    <Typography
                        variant="subtitle1"
                        sx={{
                            mb: 1,
                            fontWeight: 'medium',
                            color: 'text.primary',
                        }}
                    >
                        Chọn thêm thành viên
                    </Typography>

                    <List
                        sx={{
                            maxHeight: 300,
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
                                    primary="Không tìm thấy bạn bè phù hợp"
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
                                        checked={selectedMembers.includes(
                                            contact.id,
                                        )}
                                        onChange={() =>
                                            handleToggleMember(contact.id)
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
                        onClick={handleCloseCreateGroup}
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
                        onClick={handleCreateGroup}
                        disabled={
                            !groupName.trim() || selectedMembers.length === 0
                        }
                        variant="contained"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 3,
                        }}
                    >
                        Tạo nhóm
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

export default PersonalChatInfoPanel;
