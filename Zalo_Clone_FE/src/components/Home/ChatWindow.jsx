import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
    Box,
    Avatar,
    Typography,
    IconButton,
    TextField,
    Paper,
    styled,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Menu,
    MenuItem,
    Tooltip,
} from '@mui/material';
import {
    BiSearch,
    BiPhone,
    BiVideo,
    BiDotsVerticalRounded,
    BiSmile,
    BiPaperclip,
    BiSend,
    BiUndo,
    BiTrash,
    BiShare,
    BiGroup,
    BiPin,
    BiEdit,
    BiImage,
    BiFile,
    BiMicrophone,
    BiCheck,
    BiMenu,
    BiInfoCircle,
} from 'react-icons/bi';
import { BsCheckAll } from 'react-icons/bs';
import Picker from 'emoji-picker-react';
import {
    sendMessage,
    uploadFile,
    recallMessage,
    deleteMessage,
    forwardMessage,
    pinMessage,
    unpinMessage,
    getPinnedMessages,
    editMessage,
    sendCallSignal,
    readMessage,
} from '../../api/messageApi';
import { fetchGroupMembers } from '../../api/groupApi';
import SearchMessages from '../../components/SearchMessages';
import FriendModal from './FriendModal';
import VideoCallModal from './VideoCallModal';
import GroupInfoPanel from './GroupInfoPanel';
import PersonalChatInfoPanel from './PersonalChatInfoPanel';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getLastSeenText } from '../../utils/timeUtils';
import {
    initializePeerConnection,
    startCall,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    endCall,
    toggleAudio,
    toggleVideo,
} from '../../services/webrtcService';

const ChatContainer = styled(Box)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.grey[100],
}));

const MessageContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isSender',
})(({ theme, isSender }) => ({
    display: 'flex',
    justifyContent: isSender ? 'flex-end' : 'flex-start',
    marginBottom: 2,
    padding: '8px 16px',
    alignItems: 'center',
}));

const MessageBubble = styled(Paper, {
    shouldForwardProp: (prop) => prop !== 'isSender',
})(({ isSender, theme }) => ({
    padding: '10px 16px',
    backgroundColor: isSender ? '#0091ff' : '#ffffff',
    color: isSender ? 'white' : 'black',
    borderRadius: 18,
    position: 'relative',
    maxWidth: '70%',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
}));

const PinIndicator = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: -10,
    right: 10,
    color: theme.palette.warning.main,
}));

const ChatWindow = ({
    selectedContact,
    messages,
    messageInput,
    onMessageInputChange,
    onSendMessage,
    onProfileOpen,
    userId,
    contacts,
    token,
}) => {
    const [localMessages, setLocalMessages] = useState(messages);
    const [isSending, setIsSending] = useState(false);
    const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [pinnedMessagesDialogOpen, setPinnedMessagesDialogOpen] =
        useState(false);
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [syncedPinnedIds, setSyncedPinnedIds] = useState(new Set());
    const [messageToForward, setMessageToForward] = useState(null);
    const [messageToEdit, setMessageToEdit] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [groupMembers, setGroupMembers] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef(null);
    const documentInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const messageInputRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const open = Boolean(anchorEl);

    // Reset pinned state when switching conversations to avoid showing stale pins
    useEffect(() => {
        setPinnedMessages([]);
        setPinnedMessagesDialogOpen(false);
    }, [selectedContact?.id]);

    // Video call states
    const [callModalOpen, setCallModalOpen] = useState(false);
    const [isVideoCall, setIsVideoCall] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [callStatus, setCallStatus] = useState('');
    const [isInitiator, setIsInitiator] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);

    // Cập nhật thời gian mỗi phút để hiển thị "last seen" realtime
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Cập nhật mỗi phút

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (messageInputRef.current) {
            messageInputRef.current.focus();
        }
    }, [selectedContact]);
    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    const handleProfileOpen = () => {
        setProfileData(selectedContact);
        setIsFriendModalOpen(true);
    };

    const handleProfileClose = () => {
        setIsFriendModalOpen(false);
        setProfileData(null);
    };

    useEffect(() => {
        // Deduplicate by id but always take the latest version (to keep refreshed flags like isPinned/isRead)
        const mapById = new Map();
        messages.forEach((msg) => {
            mapById.set(msg.id || msg.tempKey || `${msg.createAt}-${msg.senderId}`, msg);
        });
        setLocalMessages((prev) => {
            const merged = Array.from(mapById.values()).map((msg) => {
                // Preserve local pinned state if backend list already marked it pinned
                if (syncedPinnedIds.has(msg.id)) {
                    return { ...msg, isPinned: true };
                }
                return msg;
            });
            return merged;
        });
    }, [messages, syncedPinnedIds]);

    // Tách riêng useEffect để đánh dấu tin nhắn đã đọc
    useEffect(() => {
        if (!selectedContact || selectedContact.isGroup || !token) return;

        // Đợi một chút để đảm bảo WebSocket đã kết nối
        const timer = setTimeout(() => {
            // Chỉ đánh dấu tin nhắn chưa đọc khi mở chat lần đầu
            const unreadMessages = localMessages.filter(
                (msg) => msg.senderId !== userId && !msg.isRead && msg.id,
            );

            if (unreadMessages.length > 0) {
                console.log(
                    `Marking ${unreadMessages.length} messages as read`,
                );
                const successfulReads = [];

                unreadMessages.forEach((msg) => {
                    const success = readMessage(
                        msg.id,
                        msg.senderId,
                        userId,
                        token,
                    );
                    if (success) {
                        successfulReads.push(msg.id);
                    }
                });

                // Chỉ cập nhật local state cho những tin nhắn đã gửi read receipt thành công
                if (successfulReads.length > 0) {
                    setTimeout(() => {
                        setLocalMessages((prev) =>
                            prev.map((m) =>
                                successfulReads.includes(m.id)
                                    ? { ...m, isRead: true }
                                    : m,
                            ),
                        );
                    }, 200);
                }
            }
        }, 500); // Đợi 500ms để WebSocket connect xong

        return () => clearTimeout(timer);
    }, [selectedContact?.id]); // Chỉ chạy khi đổi contact

    useEffect(() => {
        if (!token) {
            setGroupMembers([]);
            return;
        }

        if (selectedContact?.isGroup) {
            fetchGroupMembers(selectedContact.id, token)
                .then((members) => {
                    setGroupMembers(members);
                })
                .catch((error) => {
                    console.error('Error fetching group members:', error);
                    setGroupMembers([]);
                });
        } else {
            setGroupMembers([]);
        }
    }, [selectedContact, token]);

    const handleShowPinnedMessages = async () => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để xem tin nhắn đã ghim');
            return;
        }

        try {
            const pinned = await getPinnedMessages(
                // Với nhóm: chỉ cần groupId, otherUserId để null để tránh backend trả về tất cả
                selectedContact.isGroup ? null : selectedContact.id,
                selectedContact.isGroup ? selectedContact.id : null,
                token,
            );

            console.log('🔍 Raw pinned messages from backend:', pinned);
            console.log('📌 Current contact:', selectedContact);
            console.log('👤 Current userId:', userId);

            const filteredPinned = (pinned || [])
                .filter((msg) => {
                    const isPinnedFlag =
                        msg.isPinned === true || msg.isPinned === 'true';
                    const hasPinMeta = !!(
                        msg.pinBy ||
                        msg.pinnedBy ||
                        msg.pinnedAt ||
                        msg.pinAt ||
                        msg.pinTime
                    );

                    if (!isPinnedFlag && !hasPinMeta) {
                        console.log('Skip not-marked-pinned:', msg.id);
                        return false;
                    }

                    if (selectedContact.isGroup) {
                        const sameGroup = msg.groupId === selectedContact.id;
                        if (!sameGroup) {
                            console.log(
                                'Skip non-group message for current group:',
                                msg.id,
                                msg.groupId,
                            );
                        }
                        return sameGroup;
                    }

                    const otherId = selectedContact.id;
                    const isDirectMessage =
                        msg.groupId === undefined || msg.groupId === null;
                    const involvesCurrentPair =
                        (msg.senderId === userId &&
                            msg.receiverId === otherId) ||
                        (msg.senderId === otherId && msg.receiverId === userId);

                    if (!isDirectMessage || !involvesCurrentPair) {
                        console.log(
                            'Skip message not in this DM pair:',
                            msg.id,
                            msg.groupId,
                            msg.senderId,
                            msg.receiverId,
                        );
                    }

                    return isDirectMessage && involvesCurrentPair;
                })
                .reduce((unique, msg) => {
                    if (!unique.some((item) => item.id === msg.id)) {
                        unique.push(msg);
                    }
                    return unique;
                }, []);

            console.log('✅ Filtered pinned messages:', filteredPinned);
            setPinnedMessages(filteredPinned);
            setSyncedPinnedIds(new Set(filteredPinned.map((m) => m.id)));
            setPinnedMessagesDialogOpen(true);
        } catch (error) {
            console.error('Error fetching pinned messages:', error);
            let errorMessage = 'Lỗi tải tin nhắn đã ghim';
            if (error.response) {
                if (error.response.status === 403) {
                    errorMessage =
                        'Không có quyền truy cập tin nhắn đã ghim. Vui lòng kiểm tra lại quyền truy cập nhóm.';
                } else if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            } else {
                errorMessage = error.message || errorMessage;
            }
            toast.error(errorMessage);
        }
    };

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;
        if (!token) {
            toast.error('Vui lòng đăng nhập để gửi tin nhắn');
            return;
        }

        setIsSending(true);

        const tempKey = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}`;
        const message = {
            senderId: userId,
            [selectedContact.isGroup ? 'groupId' : 'receiverId']:
                selectedContact.id,
            content: messageInput,
            type: 'TEXT',
            tempKey: tempKey,
        };

        try {
            console.log('Attempting to send message:', message);
            const success = sendMessage('/app/chat.send', message, token);
            if (success) {
                const newMessage = {
                    ...message,
                    createAt: new Date().toISOString(),
                    recalled: false,
                    deletedByUsers: [],
                    isRead: false,
                    isPinned: false,
                    isEdited: false,
                };
                onMessageInputChange({ target: { value: '' } });
                onSendMessage(newMessage);
            } else {
                toast.error(
                    'Không thể gửi tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error(`Lỗi gửi tin nhắn: ${error.message}`);
        } finally {
            setIsSending(false);
            setShowEmojiPicker(false);
        }
    };

    const onEmojiClick = (emojiObject) => {
        const newMessageInput = messageInput + emojiObject.emoji;
        onMessageInputChange({ target: { value: newMessageInput } });
        setShowEmojiPicker(false);
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Voice/Video Call Handlers
    const handleStartCall = async (withVideo = false) => {
        if (selectedContact?.isGroup) {
            toast.error('Không thể gọi cho nhóm');
            return;
        }

        try {
            setIsVideoCall(withVideo);
            setIsInitiator(true);
            setCallStatus('Đang kết nối...');
            setCallModalOpen(true);

            // Initialize peer connection
            initializePeerConnection(
                (candidate) => {
                    // Send ICE candidate to peer
                    sendCallSignal(
                        'ice-candidate',
                        candidate,
                        selectedContact.id,
                        token,
                    );
                },
                (stream) => {
                    // Receive remote stream
                    setRemoteStream(stream);
                    setCallStatus('Đang gọi...');
                },
            );

            // Get local media stream
            const stream = await startCall(withVideo);
            setLocalStream(stream);

            // Create and send offer
            const offer = await createOffer();
            sendCallSignal(
                'offer',
                { offer, isVideoCall: withVideo },
                selectedContact.id,
                token,
            );

            setCallStatus('Đang đổ chuông...');
        } catch (error) {
            console.error('Error starting call:', error);

            // Show specific error message for permissions
            if (error.message.includes('quyền truy cập')) {
                toast.error(
                    'Vui lòng cho phép quyền microphone/camera! Click vào icon 🔒 bên cạnh URL và bật quyền.',
                    { autoClose: 8000 },
                );
            } else {
                toast.error('Không thể bắt đầu cuộc gọi: ' + error.message);
            }
            handleEndCall();
        }
    };

    const handleEndCall = () => {
        endCall();
        setCallModalOpen(false);
        setLocalStream(null);
        setRemoteStream(null);
        setCallStatus('');
        setIsInitiator(false);
        setIsAudioEnabled(true);
        setIsVideoEnabled(true);

        if (isInitiator) {
            sendCallSignal('call-end', {}, selectedContact.id, token);
        }
    };

    const handleToggleAudio = () => {
        const enabled = toggleAudio();
        setIsAudioEnabled(enabled);
    };

    const handleToggleVideo = () => {
        const enabled = toggleVideo();
        setIsVideoEnabled(enabled);
    };

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (!files.length) return;
        if (!token) {
            toast.error('Vui lòng đăng nhập để gửi file');
            return;
        }
        if (!selectedContact?.id) {
            toast.error('Không tìm thấy ID liên hệ hoặc nhóm');
            return;
        }

        console.log('Uploading files:', {
            isGroup: selectedContact.isGroup,
            id: selectedContact.id,
            files: files.map((f) => ({
                name: f.name,
                type: f.type,
                size: f.size,
            })),
            token: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        });

        setIsSending(true);
        try {
            const response = await uploadFile(
                files,
                selectedContact.isGroup ? null : selectedContact.id,
                token,
                selectedContact.isGroup ? selectedContact.id : null,
            );
            // File sẽ tự động xuất hiện trong chat khi upload xong
        } catch (error) {
            console.error('Error uploading file:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers,
                token: token ? 'EXISTS' : 'NO TOKEN',
            });

            // Xử lý lỗi cụ thể
            if (error.response?.status === 403) {
                toast.error('Lỗi xác thực. Vui lòng đăng nhập lại!');
            } else if (error.response?.status === 401) {
                toast.error('Token hết hạn. Vui lòng đăng nhập lại!');
            } else {
                toast.error(
                    `Lỗi gửi file: ${
                        error.response?.data?.message || error.message
                    }`,
                );
            }
        } finally {
            setIsSending(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            if (documentInputRef.current) {
                documentInputRef.current.value = '';
            }
        }
    };

    const handleRecallMessage = (message) => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để thu hồi tin nhắn');
            return;
        }

        setIsSending(true);
        try {
            const identifier = message.id;
            if (!identifier) {
                throw new Error('Missing message identifier.');
            }
            const success = recallMessage(identifier, userId, token);
            if (success) {
                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === message.id
                            ? { ...msg, recalled: true }
                            : msg,
                    ),
                );
                toast.success('Đã thu hồi');
            } else {
                toast.error(
                    'Không thể thu hồi tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Error recalling message:', error);
            toast.error(`Lỗi thu hồi tin nhắn: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteMessage = (message) => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để xóa tin nhắn');
            return;
        }

        setIsSending(true);
        try {
            const identifier = message.id;
            if (!identifier) {
                throw new Error('Missing message identifier.');
            }
            const success = deleteMessage(identifier, userId, token);
            if (success) {
                const deletedMessageIds = JSON.parse(
                    localStorage.getItem('deletedMessageIds') || '[]',
                );
                if (message.id && !deletedMessageIds.includes(message.id)) {
                    deletedMessageIds.push(message.id);
                    localStorage.setItem(
                        'deletedMessageIds',
                        JSON.stringify(deletedMessageIds),
                    );
                }

                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === message.id
                            ? {
                                  ...msg,
                                  deletedByUsers: [
                                      ...(msg.deletedByUsers || []),
                                      userId,
                                  ],
                              }
                            : msg,
                    ),
                );
                toast.success('Đã xóa');
            } else {
                toast.error(
                    'Không thể xóa tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            toast.error(`Lỗi xóa tin nhắn: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const handlePinMessage = (message) => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để ghim tin nhắn');
            return;
        }

        setIsSending(true);
        try {
            const identifier = message.id;
            if (!identifier) {
                throw new Error('Missing message identifier.');
            }
            const success = pinMessage(identifier, userId, token);
            if (success) {
                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === message.id
                            ? { ...msg, isPinned: true }
                            : msg,
                    ),
                );
                toast.success('Đã ghim');
            } else {
                toast.error(
                    'Không thể ghim tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Error pinning message:', error);
            toast.error(`Lỗi ghim tin nhắn: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const handleUnpinMessage = (message) => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để bỏ ghim tin nhắn');
            return;
        }

        setIsSending(true);
        try {
            const identifier = message.id;
            if (!identifier) {
                throw new Error('Missing message identifier.');
            }
            const success = unpinMessage(identifier, userId, token);
            if (success) {
                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === message.id
                            ? { ...msg, isPinned: false }
                            : msg,
                    ),
                );
                toast.success('Đã bỏ ghim');
            } else {
                toast.error(
                    'Không thể bỏ ghim tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Error unpinning message:', error);
            toast.error(`Lỗi bỏ ghim tin nhắn: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const handleUnpinFromModal = async (message) => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để bỏ ghim tin nhắn');
            return;
        }

        try {
            const success = await unpinMessage(message.id, userId, token);
            if (success) {
                setPinnedMessages((prev) =>
                    prev.filter((msg) => msg.id !== message.id),
                );
                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === message.id
                            ? { ...msg, isPinned: false }
                            : msg,
                    ),
                );
                toast.success('Đã bỏ ghim');
            } else {
                toast.error(
                    'Không thể bỏ ghim tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Error unpinning message from modal:', error);
            toast.error(`Lỗi bỏ ghim tin nhắn: ${error.message}`);
        }
    };

    const handleOpenForwardDialog = (message) => {
        setMessageToForward(message);
        setForwardDialogOpen(true);
    };

    const handleOpenEditDialog = (message) => {
        if (message.type !== 'TEXT') {
            toast.error('Chỉ có thể chỉnh sửa tin nhắn văn bản');
            return;
        }
        setMessageToEdit(message);
        setEditContent(message.content);
        setEditDialogOpen(true);
    };

    const handleEditMessage = async () => {
        if (!editContent.trim()) {
            toast.error('Nội dung tin nhắn không được để trống');
            return;
        }
        if (!token) {
            toast.error('Vui lòng đăng nhập để chỉnh sửa tin nhắn');
            return;
        }

        setIsSending(true);
        try {
            const success = await editMessage(
                messageToEdit.id,
                userId,
                editContent,
                selectedContact.isGroup ? selectedContact.id : null,
                token,
            );
            if (success) {
                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === messageToEdit.id
                            ? { ...msg, content: editContent, isEdited: true }
                            : msg,
                    ),
                );
                toast.success('Đã chỉnh sửa');
            } else {
                toast.error(
                    'Không thể chỉnh sửa tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Error editing message:', error);
            toast.error(`Lỗi chỉnh sửa tin nhắn: ${error.message}`);
        } finally {
            setIsSending(false);
            setEditDialogOpen(false);
            setMessageToEdit(null);
            setEditContent('');
        }
    };

    const handleForwardMessage = (contact) => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để chuyển tiếp tin nhắn');
            return;
        }
        if (!contact.id) {
            toast.error('Không tìm thấy ID của liên hệ hoặc nhóm');
            return;
        }

        setIsSending(true);
        try {
            const identifier = messageToForward?.id;
            if (!identifier) {
                throw new Error('Missing message identifier.');
            }
            console.log('Forwarding message:', {
                identifier,
                userId,
                receiverId: contact.isGroup ? null : contact.id,
                groupId: contact.isGroup ? contact.id : null,
                content: messageToForward.content,
                type: messageToForward.type,
            });
            const success = forwardMessage(
                identifier,
                userId,
                contact.isGroup ? null : contact.id,
                contact.isGroup ? contact.id : null,
                messageToForward.content,
                token,
            );
            if (success) {
                toast.success('Đã chuyển tiếp');
            } else {
                toast.error(
                    'Không thể chuyển tiếp tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Lỗi chuyển tiếp tin nhắn:', error);
            toast.error(`Lỗi chuyển tiếp tin nhắn: ${error.message}`);
        } finally {
            setIsSending(false);
            setForwardDialogOpen(false);
            setMessageToForward(null);
        }
    };

    const handleSelectMessage = (message) => {
        setPinnedMessagesDialogOpen(false);
        const messageElement = document.getElementById(`message-${message.id}`);
        if (messageElement) {
            messageElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    };

    const getMessagePreview = (msg) => {
        if (!msg) return '';
        switch (msg.type) {
            case 'TEXT':
                return msg.content || '';
            case 'IMAGE':
                return '[Hình ảnh]';
            case 'VIDEO':
                return '[Video]';
            case 'AUDIO':
                return '[Âm thanh]';
            case 'FILE':
                return msg.fileName || '[Tệp đính kèm]';
            default:
                return '[Tin nhắn]';
        }
    };

    const pinnedHighlight = useMemo(() => {
        const pinned = localMessages.filter((m) => m.isPinned);
        if (!pinned.length) return null;

        return pinned.reduce((latest, msg) => {
            const latestTime = new Date(
                latest.createAt || latest.createdAt || 0,
            ).getTime();
            const msgTime = new Date(
                msg.createAt || msg.createdAt || 0,
            ).getTime();
            return msgTime >= latestTime ? msg : latest;
        }, pinned[0]);
    }, [localMessages]);

    useEffect(() => {
        if (!selectedContact || !token) {
            setSyncedPinnedIds(new Set());
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const pinned = await getPinnedMessages(
                    selectedContact.isGroup ? null : selectedContact.id,
                    selectedContact.isGroup ? selectedContact.id : null,
                    token,
                );

                if (cancelled) return;

                const ids = new Set((pinned || []).map((m) => m.id));
                setSyncedPinnedIds(ids);
                setPinnedMessages(pinned || []);
                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        ids.has(msg.id) ? { ...msg, isPinned: true } : msg,
                    ),
                );
            } catch (error) {
                console.error('Error syncing pinned messages:', error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [selectedContact?.id, selectedContact?.isGroup, token]);

    if (!selectedContact) {
        return (
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
                width="100%"
                textAlign="center"
            >
                <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ textAlign: 'center' }}
                >
                    Chọn một cuộc trò chuyện để bắt đầu nhắn tin
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flex: 1,
                height: '100%',
                overflow: 'hidden',
            }}
        >
            <ChatContainer>
                <Box
                    p={2}
                    display="flex"
                    alignItems="center"
                    borderBottom={1}
                    borderColor="divider"
                    sx={{
                        bgcolor: 'white',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                >
                    <Avatar
                        src={selectedContact.avatar}
                        sx={{ cursor: 'pointer', width: 48, height: 48 }}
                        onClick={handleProfileOpen}
                    >
                        {selectedContact.isGroup && <BiGroup />}
                    </Avatar>
                    <Box
                        ml={2}
                        flex={1}
                        sx={{ cursor: 'pointer' }}
                        onClick={handleProfileOpen}
                    >
                        <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 'bold', fontSize: '1rem' }}
                        >
                            {selectedContact.name}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{ fontSize: '0.85rem' }}
                            key={currentTime.getTime()}
                        >
                            {selectedContact.isGroup
                                ? `Nhóm`
                                : selectedContact.status === 'online'
                                ? 'Đang hoạt động'
                                : selectedContact.lastSeen
                                ? `Hoạt động ${getLastSeenText(
                                      selectedContact.lastSeen,
                                  )}`
                                : 'Không hoạt động'}
                        </Typography>
                    </Box>
                    {selectedContact.isGroup ? (
                        <>
                            <IconButton
                                onClick={() => setShowSearchBar(!showSearchBar)}
                                sx={{ color: '#666' }}
                            >
                                <BiSearch size={22} />
                            </IconButton>
                            <IconButton
                                onClick={handleShowPinnedMessages}
                                sx={{ color: '#666' }}
                            >
                                <BiPin size={22} />
                            </IconButton>
                            <IconButton
                                onClick={() => setShowGroupInfo(!showGroupInfo)}
                                sx={{
                                    color: showGroupInfo ? '#0091ff' : '#666',
                                }}
                                title="Thông tin nhóm"
                            >
                                <BiInfoCircle size={22} />
                            </IconButton>
                        </>
                    ) : (
                        <>
                            <IconButton
                                onClick={() => setShowSearchBar(!showSearchBar)}
                                sx={{ color: '#666' }}
                            >
                                <BiSearch size={22} />
                            </IconButton>
                            <IconButton
                                onClick={handleShowPinnedMessages}
                                sx={{ color: '#666' }}
                            >
                                <BiPin size={22} />
                            </IconButton>
                            {!selectedContact?.isGroup && (
                                <>
                                    <IconButton
                                        onClick={() => handleStartCall(false)}
                                        sx={{ color: '#666' }}
                                        title="Gọi thoại"
                                    >
                                        <BiPhone size={22} />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleStartCall(true)}
                                        sx={{ color: '#666' }}
                                        title="Gọi video"
                                    >
                                        <BiVideo size={22} />
                                    </IconButton>
                                </>
                            )}
                            <IconButton
                                onClick={() => setShowGroupInfo(!showGroupInfo)}
                                sx={{
                                    color: showGroupInfo ? '#0091ff' : '#666',
                                }}
                                title="Thông tin"
                            >
                                <BiInfoCircle size={22} />
                            </IconButton>
                        </>
                    )}
                </Box>

                {pinnedHighlight && (
                    <Box
                        onClick={() => handleSelectMessage(pinnedHighlight)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2,
                            py: 1,
                            backgroundColor: '#fff6e6',
                            borderBottom: '1px solid #ffd599',
                            cursor: 'pointer',
                        }}
                    >
                        <BiPin color="#b56c00" size={18} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#b56c00',
                                    fontWeight: 700,
                                    letterSpacing: 0.1,
                                }}
                            >
                                Tin nhắn đã ghim
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: '#8a5a00' }}
                                noWrap
                                title={getMessagePreview(pinnedHighlight)}
                            >
                                {getMessagePreview(pinnedHighlight)}
                            </Typography>
                        </Box>
                        <Button
                            size="small"
                            variant="text"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleShowPinnedMessages();
                            }}
                            sx={{
                                textTransform: 'none',
                                color: '#b56c00',
                                fontWeight: 600,
                                minWidth: 0,
                                px: 1,
                            }}
                        >
                            Xem tất cả
                        </Button>
                    </Box>
                )}

                {showSearchBar && (
                    <SearchMessages
                        userId={userId}
                        selectedContact={selectedContact}
                        token={token}
                        onSelectMessage={handleSelectMessage}
                        onClose={() => setShowSearchBar(false)}
                    />
                )}

                <Box
                    flex={1}
                    overflow="auto"
                    p={2}
                    sx={{ bgcolor: '#f0f0f0', position: 'relative' }}
                >
                    {isSending && (
                        <Box display="flex" justifyContent="center" my={2}>
                            <CircularProgress size={24} />
                        </Box>
                    )}
                    {localMessages.map((message, index) => (
                        <MessageContainer
                            key={
                                message.id
                                    ? `${message.id}-${index}`
                                    : message.tempKey
                                    ? `${message.tempKey}-${index}`
                                    : `${message.createAt}-${message.senderId}-${index}`
                            }
                            isSender={message.senderId === userId}
                            id={`message-${message.id}`}
                        >
                            {!message.recalled &&
                                !message.deletedByUsers?.includes(userId) && (
                                    <Box
                                        display="flex"
                                        flexDirection="row"
                                        alignItems="center"
                                    >
                                        {/* Pin button - cho phép ghim cả tin nhắn của mình và người khác */}
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                message.isPinned
                                                    ? handleUnpinMessage(
                                                          message,
                                                      )
                                                    : handlePinMessage(message)
                                            }
                                            disabled={isSending}
                                        >
                                            <BiPin />
                                        </IconButton>

                                        {/* Các action khác chỉ cho tin nhắn của mình */}
                                        {message.senderId === userId &&
                                            message.type === 'TEXT' && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleOpenEditDialog(
                                                            message,
                                                        )
                                                    }
                                                    disabled={isSending}
                                                >
                                                    <BiEdit />
                                                </IconButton>
                                            )}

                                        {/* Menu gom 3 hành động khác */}
                                        <IconButton
                                            size="small"
                                            onClick={handleMenuOpen}
                                        >
                                            <BiDotsVerticalRounded />
                                        </IconButton>
                                        <Menu
                                            anchorEl={anchorEl}
                                            open={open}
                                            onClose={handleMenuClose}
                                        >
                                            {/* Thu hồi và Xóa chỉ cho tin nhắn của mình */}
                                            {message.senderId === userId && (
                                                <MenuItem
                                                    onClick={() => {
                                                        handleRecallMessage(
                                                            message,
                                                        );
                                                        handleMenuClose();
                                                    }}
                                                    disabled={isSending}
                                                >
                                                    <BiUndo
                                                        style={{
                                                            marginRight: 8,
                                                        }}
                                                    />{' '}
                                                    Thu hồi
                                                </MenuItem>
                                            )}
                                            {message.senderId === userId && (
                                                <MenuItem
                                                    onClick={() => {
                                                        handleDeleteMessage(
                                                            message,
                                                        );
                                                        handleMenuClose();
                                                    }}
                                                    disabled={isSending}
                                                >
                                                    <BiTrash
                                                        style={{
                                                            marginRight: 8,
                                                        }}
                                                    />{' '}
                                                    Xóa
                                                </MenuItem>
                                            )}
                                            {/* Chuyển tiếp cho phép với tất cả tin nhắn */}
                                            <MenuItem
                                                onClick={() => {
                                                    handleOpenForwardDialog(
                                                        message,
                                                    );
                                                    handleMenuClose();
                                                }}
                                                disabled={isSending}
                                            >
                                                <BiShare
                                                    style={{ marginRight: 8 }}
                                                />{' '}
                                                Chuyển tiếp
                                            </MenuItem>
                                        </Menu>
                                    </Box>
                                )}
                            <MessageBubble
                                isSender={message.senderId === userId}
                            >
                                {message.isPinned && (
                                    <PinIndicator>
                                        <BiPin />
                                    </PinIndicator>
                                )}
                                {message.recalled ? (
                                    <Typography fontStyle="italic">
                                        Tin nhắn đã được thu hồi
                                    </Typography>
                                ) : message.deletedByUsers?.includes(
                                      message.senderId,
                                  ) ||
                                  message.deletedByUsers?.includes(
                                      message.receiverId,
                                  ) ||
                                  message.deletedByUsers?.includes(userId) ? (
                                    <Typography fontStyle="italic">
                                        Tin nhắn đã bị xóa
                                    </Typography>
                                ) : message.type === 'TEXT' ? (
                                    <>
                                        {selectedContact.isGroup &&
                                            message.senderId !== userId && (
                                                <Typography
                                                    variant="caption"
                                                    display="block"
                                                    sx={{ opacity: 0.7, mb: 1 }}
                                                >
                                                    {groupMembers.find(
                                                        (m) =>
                                                            m.id ===
                                                            message.senderId,
                                                    )?.username || 'Unknown'}
                                                </Typography>
                                            )}
                                        <Typography>
                                            {message.content}
                                        </Typography>
                                        {message.isEdited && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    opacity: 0.7,
                                                    fontStyle: 'italic',
                                                }}
                                            >
                                                (Đã chỉnh sửa)
                                            </Typography>
                                        )}
                                    </>
                                ) : message.type === 'IMAGE' ? (
                                    <>
                                        {selectedContact.isGroup &&
                                            message.senderId !== userId && (
                                                <Typography
                                                    variant="caption"
                                                    display="block"
                                                    sx={{ opacity: 0.7, mb: 1 }}
                                                >
                                                    {groupMembers.find(
                                                        (m) =>
                                                            m.id ===
                                                            message.senderId,
                                                    )?.username || 'Unknown'}
                                                </Typography>
                                            )}
                                        <img
                                            src={message.content}
                                            alt="Uploaded"
                                            style={{
                                                maxWidth: '200px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() =>
                                                window.open(
                                                    message.content,
                                                    '_blank',
                                                )
                                            }
                                        />
                                    </>
                                ) : message.type === 'VIDEO' ? (
                                    <>
                                        {selectedContact.isGroup &&
                                            message.senderId !== userId && (
                                                <Typography
                                                    variant="caption"
                                                    display="block"
                                                    sx={{ opacity: 0.7, mb: 1 }}
                                                >
                                                    {groupMembers.find(
                                                        (m) =>
                                                            m.id ===
                                                            message.senderId,
                                                    )?.username || 'Unknown'}
                                                </Typography>
                                            )}
                                        <video
                                            src={message.content}
                                            controls
                                            style={{
                                                maxWidth: '200px',
                                                borderRadius: '8px',
                                            }}
                                        />
                                    </>
                                ) : message.type === 'AUDIO' ? (
                                    <>
                                        {selectedContact.isGroup &&
                                            message.senderId !== userId && (
                                                <Typography
                                                    variant="caption"
                                                    display="block"
                                                    sx={{ opacity: 0.7, mb: 1 }}
                                                >
                                                    {groupMembers.find(
                                                        (m) =>
                                                            m.id ===
                                                            message.senderId,
                                                    )?.username || 'Unknown'}
                                                </Typography>
                                            )}
                                        <audio
                                            controls
                                            style={{ maxWidth: '200px' }}
                                        >
                                            <source
                                                src={message.content}
                                                type="audio/mpeg"
                                            />
                                            <source
                                                src={message.content}
                                                type="audio/wav"
                                            />
                                            <source
                                                src={message.content}
                                                type="audio/ogg"
                                            />
                                            Trình duyệt của bạn không hỗ trợ
                                            phát audio.
                                        </audio>
                                    </>
                                ) : message.type === 'FORWARD' ? (
                                    <>
                                        {selectedContact.isGroup &&
                                            message.senderId !== userId && (
                                                <Typography
                                                    variant="caption"
                                                    display="block"
                                                    sx={{ opacity: 0.7, mb: 1 }}
                                                >
                                                    {groupMembers.find(
                                                        (m) =>
                                                            m.id ===
                                                            message.senderId,
                                                    )?.username || 'Unknown'}
                                                </Typography>
                                            )}
                                        <Box>
                                            <Typography
                                                fontStyle="italic"
                                                variant="caption"
                                            >
                                                Chuyển tiếp từ{' '}
                                                {message.forwardedFrom
                                                    ?.senderId ||
                                                    'người dùng khác'}
                                            </Typography>
                                            <Typography>
                                                {message.content}
                                            </Typography>
                                        </Box>
                                    </>
                                ) : message.type === 'FILE' ? (
                                    <>
                                        {selectedContact.isGroup &&
                                            message.senderId !== userId && (
                                                <Typography
                                                    variant="caption"
                                                    display="block"
                                                    sx={{ opacity: 0.7, mb: 1 }}
                                                >
                                                    {groupMembers.find(
                                                        (m) =>
                                                            m.id ===
                                                            message.senderId,
                                                    )?.username || 'Unknown'}
                                                </Typography>
                                            )}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                padding: '8px 12px',
                                                backgroundColor:
                                                    message.senderId === userId
                                                        ? 'rgba(255,255,255,0.2)'
                                                        : '#f0f2f5',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    opacity: 0.8,
                                                },
                                            }}
                                            onClick={async () => {
                                                try {
                                                    // Remove ?fl_attachment or &fl_attachment from old URLs
                                                    let fileUrl =
                                                        message.content;
                                                    if (
                                                        fileUrl.includes(
                                                            '?fl_attachment',
                                                        )
                                                    ) {
                                                        fileUrl =
                                                            fileUrl.replace(
                                                                '?fl_attachment',
                                                                '',
                                                            );
                                                    }
                                                    if (
                                                        fileUrl.includes(
                                                            '&fl_attachment',
                                                        )
                                                    ) {
                                                        fileUrl =
                                                            fileUrl.replace(
                                                                '&fl_attachment',
                                                                '',
                                                            );
                                                    }

                                                    // Fetch file as blob to avoid navigation
                                                    const response =
                                                        await fetch(fileUrl);
                                                    const blob =
                                                        await response.blob();

                                                    // Create blob URL and trigger download
                                                    const blobUrl =
                                                        window.URL.createObjectURL(
                                                            blob,
                                                        );
                                                    const link =
                                                        document.createElement(
                                                            'a',
                                                        );
                                                    link.href = blobUrl;
                                                    link.download =
                                                        message.fileName ||
                                                        'file';
                                                    document.body.appendChild(
                                                        link,
                                                    );
                                                    link.click();
                                                    document.body.removeChild(
                                                        link,
                                                    );

                                                    // Clean up blob URL
                                                    window.URL.revokeObjectURL(
                                                        blobUrl,
                                                    );
                                                } catch (error) {
                                                    console.error(
                                                        'Error downloading file:',
                                                        error,
                                                    );
                                                    // Fallback: open in new tab with cleaned URL
                                                    let fileUrl =
                                                        message.content;
                                                    if (
                                                        fileUrl.includes(
                                                            '?fl_attachment',
                                                        )
                                                    ) {
                                                        fileUrl =
                                                            fileUrl.replace(
                                                                '?fl_attachment',
                                                                '',
                                                            );
                                                    }
                                                    if (
                                                        fileUrl.includes(
                                                            '&fl_attachment',
                                                        )
                                                    ) {
                                                        fileUrl =
                                                            fileUrl.replace(
                                                                '&fl_attachment',
                                                                '',
                                                            );
                                                    }
                                                    window.open(
                                                        fileUrl,
                                                        '_blank',
                                                    );
                                                }
                                            }}
                                        >
                                            <BiFile
                                                size={32}
                                                color={
                                                    message.senderId === userId
                                                        ? '#fff'
                                                        : '#0091ff'
                                                }
                                            />
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 500,
                                                        overflow: 'hidden',
                                                        textOverflow:
                                                            'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {message.fileName ||
                                                        'Tệp đính kèm'}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{ opacity: 0.8 }}
                                                >
                                                    Nhấn để tải xuống
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </>
                                ) : (
                                    <Typography>
                                        Loại tin nhắn không được hỗ trợ
                                    </Typography>
                                )}
                                <Typography
                                    variant="caption"
                                    display="block"
                                    textAlign="right"
                                    sx={{
                                        opacity: 0.7,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-end',
                                        gap: 0.5,
                                    }}
                                >
                                    {new Date(
                                        message.createAt,
                                    ).toLocaleTimeString()}
                                    {/* Hiển thị checkmark cho tin nhắn đã gửi */}
                                    {message.senderId === userId &&
                                        (message.isRead ? (
                                            <BsCheckAll
                                                size={16}
                                                style={{ color: '#0091ff' }}
                                                title="Đã xem"
                                            />
                                        ) : (
                                            <BiCheck size={16} title="Đã gửi" />
                                        ))}
                                </Typography>
                            </MessageBubble>
                        </MessageContainer>
                    ))}
                    <div ref={messagesEndRef} />
                </Box>

                <Box
                    p={1.5}
                    borderTop={1}
                    borderColor="divider"
                    sx={{ bgcolor: 'background.paper', position: 'relative' }}
                >
                    {showEmojiPicker && (
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: '100%',
                                right: 10,
                                zIndex: 1000,
                            }}
                        >
                            <Picker onEmojiClick={onEmojiClick} />
                        </Box>
                    )}
                    <Box display="flex" alignItems="center" gap={1}>
                        <IconButton
                            size="medium"
                            component="label"
                            sx={{ color: '#0084ff' }}
                            title="Gửi file"
                        >
                            <BiPaperclip size={24} />
                            <input
                                type="file"
                                multiple
                                hidden
                                ref={documentInputRef}
                                onChange={handleFileUpload}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                            />
                        </IconButton>
                        <IconButton
                            size="medium"
                            component="label"
                            sx={{ color: '#0084ff' }}
                        >
                            <BiImage size={24} />
                            <input
                                type="file"
                                multiple
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*,video/*,audio/*"
                            />
                        </IconButton>
                        <IconButton size="medium" sx={{ color: '#0084ff' }}>
                            <BiMicrophone size={24} />
                        </IconButton>
                        <TextField
                            fullWidth
                            placeholder={`Aa`}
                            variant="outlined"
                            size="small"
                            value={messageInput}
                            onChange={onMessageInputChange}
                            onKeyPress={(e) =>
                                e.key === 'Enter' && handleSendMessage()
                            }
                            inputRef={messageInputRef}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '20px',
                                    backgroundColor: '#f0f2f5',
                                    '& fieldset': {
                                        borderColor: 'transparent',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'transparent',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#0084ff',
                                        borderWidth: '1px',
                                    },
                                },
                            }}
                        />
                        <IconButton
                            size="medium"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            sx={{ color: '#0084ff' }}
                        >
                            <BiSmile size={24} />
                        </IconButton>
                        {messageInput.trim() ? (
                            <IconButton
                                onClick={handleSendMessage}
                                disabled={isSending}
                                sx={{
                                    color: '#0084ff',
                                    '&:hover': {
                                        bgcolor: 'rgba(0, 132, 255, 0.1)',
                                    },
                                }}
                            >
                                <BiSend size={24} />
                            </IconButton>
                        ) : null}
                    </Box>
                </Box>

                <Dialog
                    open={forwardDialogOpen}
                    onClose={() => setForwardDialogOpen(false)}
                >
                    <DialogTitle>
                        Chọn liên hệ hoặc nhóm để chuyển tiếp
                    </DialogTitle>
                    <DialogContent>
                        <List>
                            {contacts.map((contact) => (
                                <ListItem
                                    key={contact.id}
                                    onClick={() =>
                                        handleForwardMessage(contact)
                                    }
                                >
                                    <ListItemAvatar>
                                        <Avatar src={contact.avatar}>
                                            {contact.isGroup && <BiGroup />}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            contact.isGroup
                                                ? `[Nhóm] ${contact.name}`
                                                : contact.name
                                        }
                                        secondary={
                                            contact.isGroup
                                                ? 'Nhóm'
                                                : contact.username
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={editDialogOpen}
                    onClose={() => setEditDialogOpen(false)}
                >
                    <DialogTitle>Chỉnh sửa tin nhắn</DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Nội dung tin nhắn"
                            variant="outlined"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            multiline
                            rows={3}
                            sx={{ mt: 2 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleEditMessage}
                            disabled={isSending || !editContent.trim()}
                        >
                            Lưu
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={pinnedMessagesDialogOpen}
                    onClose={() => setPinnedMessagesDialogOpen(false)}
                >
                    <DialogTitle>Tin nhắn đã ghim</DialogTitle>
                    <DialogContent>
                        {pinnedMessages.length > 0 ? (
                            <List>
                                {pinnedMessages.map((message) => (
                                    <ListItem
                                        key={message.id}
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                onClick={() =>
                                                    handleUnpinFromModal(
                                                        message,
                                                    )
                                                }
                                                disabled={isSending}
                                            >
                                                <BiPin />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemText
                                            primary={
                                                message.type === 'IMAGE' ? (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                        }}
                                                    >
                                                        <img
                                                            src={
                                                                message.content
                                                            }
                                                            alt="Ảnh"
                                                            style={{
                                                                maxWidth:
                                                                    '100px',
                                                                maxHeight:
                                                                    '60px',
                                                                marginRight:
                                                                    '8px',
                                                            }}
                                                        />
                                                        <Typography variant="body2">
                                                            [Hình ảnh]
                                                        </Typography>
                                                    </Box>
                                                ) : message.type === 'VIDEO' ? (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                        }}
                                                    >
                                                        <video
                                                            src={
                                                                message.content
                                                            }
                                                            style={{
                                                                maxWidth:
                                                                    '100px',
                                                                maxHeight:
                                                                    '60px',
                                                                marginRight:
                                                                    '8px',
                                                            }}
                                                        />
                                                        <Typography variant="body2">
                                                            [Video]
                                                        </Typography>
                                                    </Box>
                                                ) : message.type === 'AUDIO' ? (
                                                    <Typography>
                                                        [Âm thanh]
                                                    </Typography>
                                                ) : message.type === 'FILE' ? (
                                                    <Typography>
                                                        {message.fileName ||
                                                            '[Tệp đính kèm]'}
                                                    </Typography>
                                                ) : (
                                                    message.content
                                                )
                                            }
                                            secondary={`Từ: ${
                                                selectedContact.isGroup
                                                    ? message.senderId ===
                                                      userId
                                                        ? 'Bạn'
                                                        : message.senderId
                                                    : message.senderId ===
                                                      userId
                                                    ? 'Bạn'
                                                    : selectedContact.name
                                            } - ${new Date(
                                                message.createAt,
                                            ).toLocaleString()}`}
                                            onClick={() =>
                                                handleSelectMessage(message)
                                            }
                                            sx={{ cursor: 'pointer' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography>
                                Không có tin nhắn nào được ghim.
                            </Typography>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setPinnedMessagesDialogOpen(false)}
                        >
                            Đóng
                        </Button>
                    </DialogActions>
                </Dialog>

                <FriendModal
                    open={isFriendModalOpen}
                    onClose={handleProfileClose}
                    profileData={profileData}
                    userId={userId}
                    token={token}
                    contacts={contacts}
                    onContactSelect={onSendMessage}
                />

                <VideoCallModal
                    open={callModalOpen}
                    onClose={handleEndCall}
                    contact={selectedContact}
                    isVideoCall={isVideoCall}
                    localStream={localStream}
                    remoteStream={remoteStream}
                    onToggleAudio={handleToggleAudio}
                    onToggleVideo={handleToggleVideo}
                    isAudioEnabled={isAudioEnabled}
                    isVideoEnabled={isVideoEnabled}
                    callStatus={callStatus}
                />

                <ToastContainer
                    position="top-right"
                    autoClose={2000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss={false}
                    draggable
                    pauseOnHover
                    theme="light"
                    limit={3}
                    style={{
                        fontSize: '14px',
                        fontFamily: 'inherit',
                    }}
                />
            </ChatContainer>

            {showGroupInfo &&
                (selectedContact.isGroup ? (
                    <GroupInfoPanel
                        selectedContact={selectedContact}
                        groupMembers={groupMembers}
                        messages={localMessages}
                        onClose={() => setShowGroupInfo(false)}
                    />
                ) : (
                    <PersonalChatInfoPanel
                        selectedContact={selectedContact}
                        messages={localMessages}
                        onClose={() => setShowGroupInfo(false)}
                    />
                ))}
        </Box>
    );
};

export default ChatWindow;
