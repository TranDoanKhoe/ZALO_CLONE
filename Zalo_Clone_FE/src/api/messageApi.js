import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_BASE_URL = '/api/message';
const SOCKJS_URL = '/ws';

let stompClient = null;

// Hàm lấy lịch sử tin nhắn 1-1
export const getChatHistory = async (userId, token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chat-history/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const deletedMessageIds = JSON.parse(localStorage.getItem('deletedMessageIds') || '[]');
    return response.data
      .filter(msg => !deletedMessageIds.includes(msg._id || msg.id))
      .map(msg => ({
        ...msg,
        id: msg._id || msg.id,
        _id: undefined,
      }));
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

// Hàm lấy lịch sử tin nhắn nhóm
export const getGroupChatHistory = async (groupId, token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chat-history/group/${groupId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const deletedMessageIds = JSON.parse(localStorage.getItem('deletedMessageIds') || '[]');
    return response.data
      .filter(msg => !deletedMessageIds.includes(msg._id || msg.id))
      .map(msg => ({
        ...msg,
        id: msg._id || msg.id,
        _id: undefined,
      }));
  } catch (error) {
    console.error('Error fetching group chat history:', error);
    throw error;
  }
};

// Hàm upload file
export const uploadFile = async (files, receiverId, token, groupId = null, replyToMessageId = null) => {
  if (!stompClient || !stompClient.connected) {
    throw new Error('Không thể gửi file: WebSocket không hoạt động');
  }
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('file', file);
    });
    if (receiverId) formData.append('receiverId', receiverId);
    if (groupId) formData.append('groupId', groupId);
    if (replyToMessageId) formData.append('replyToMessageId', replyToMessageId);

    const response = await axios.post(`${API_BASE_URL}/upload-file`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

// Hàm tìm kiếm tin nhắn
export const searchMessages = async (userId, otherUserId, groupId, keyword, token) => {
  try {
    const effectiveOtherUserId = groupId ? userId : (otherUserId || userId);
    const params = new URLSearchParams({ otherUserId: effectiveOtherUserId, keyword });
    if (groupId) params.append('groupId', groupId);

    console.log('Search messages params:', params.toString());
    const response = await axios.get(`${API_BASE_URL}/search`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const deletedMessageIds = JSON.parse(localStorage.getItem('deletedMessageIds') || '[]');
    return response.data
      .filter(msg => !deletedMessageIds.includes(msg._id || msg.id))
      .map(msg => ({
        ...msg,
        id: msg._id || msg.id,
        _id: undefined,
        createAt: msg.createAt || msg.createdAt,
      }));
  } catch (error) {
    console.error('Error searching messages:', error.response?.data || error.message);
    throw error;
  }
};

// Hàm lấy danh sách tin nhắn đã ghim
export const getPinnedMessages = async (otherUserId, groupId, token) => {
  try {
    const params = new URLSearchParams();
    if (groupId) {
      params.append('otherUserId', otherUserId || '');
      params.append('groupId', groupId);
    } else {
      params.append('otherUserId', otherUserId);
    }

    console.log('Get pinned messages params:', params.toString());
    const response = await axios.get(`${API_BASE_URL}/all-pinned-messages`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const deletedMessageIds = JSON.parse(localStorage.getItem('deletedMessageIds') || '[]');
    return response.data
      .filter(msg => !deletedMessageIds.includes(msg._id || msg.id))
      .map(msg => ({
        ...msg,
        id: msg._id || msg.id,
        _id: undefined,
        createAt: msg.createAt || msg.createdAt,
      }));
  } catch (error) {
    console.error('Error fetching pinned messages:', error.response?.data || error.message);
    throw error;
  }
};

// Hàm ghim tin nhắn
export const pinMessage = async (messageId, userId, token) => {
  if (!stompClient || !stompClient.connected) {
    console.error('Cannot pin message: STOMP client is not connected');
    return false;
  }

  try {
    stompClient.publish({
      destination: '/app/chat.pin',
      body: JSON.stringify({ id: messageId, senderId: userId }),
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Pinned message:', messageId);
    return true;
  } catch (error) {
    console.error('Error pinning message:', error);
    return false;
  }
};

// Hàm bỏ ghim tin nhắn
export const unpinMessage = async (messageId, userId, token) => {
  if (!stompClient || !stompClient.connected) {
    console.error('Cannot unpin message: STOMP client is not connected');
    return false;
  }

  try {
    stompClient.publish({
      destination: '/app/chat.unpin',
      body: JSON.stringify({ id: messageId, senderId: userId }),
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Unpinned message:', messageId);
    return true;
  } catch (error) {
    console.error('Error unpinning message:', error);
    return false;
  }
};

// Hàm chỉnh sửa tin nhắn
export const editMessage = async (messageId, userId, content, groupId, token) => {
  if (!stompClient || !stompClient.connected) {
    console.error('Cannot edit message: STOMP client is not connected');
    return false;
  }

  try {
    const message = {
      id: messageId,
      senderId: userId,
      content,
      groupId,
    };
    stompClient.publish({
      destination: '/app/chat.edit',
      body: JSON.stringify(message),
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Edited message:', messageId, 'with content:', content);
    return true;
  } catch (error) {
    console.error('Error editing message:', error);
    return false;
  }
};

// Hàm kết nối WebSocket với STOMP
export function connectWebSocket(token, userId, onMessageCallback, onDeleteCallback, onRecallCallback, onPinCallback, onUnpinCallback, groupIds = [], onFriendRequestCallback, onEditCallback) {
  return new Promise((resolve, reject) => {
    if (!token) {
      reject(new Error('Token is missing'));
      return;
    }

    if (stompClient && stompClient.connected) {
      console.log('STOMP connection already in progress');
      resolve();
      return;
    }

    if (stompClient && stompClient.state !== 'CLOSED') {
      console.log('STOMP client state:', stompClient.state);
      resolve();
      return;
    }

    stompClient = new Client({
      webSocketFactory: () => {
        console.log('Connecting to SockJS:', SOCKJS_URL);
        return new SockJS(SOCKJS_URL);
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        userId: userId,
      },
      debug: (str) => {
        console.log('STOMP debug:', str);
      },
      reconnectDelay: 10000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = (frame) => {
      if (!stompClient) {
        console.error('STOMP client is null in onConnect');
        reject(new Error('STOMP client is null'));
        return;
      }

      console.log('STOMP connected:', frame);

      // Subscription cho tin nhắn 1-1
      stompClient.subscribe(`/user/${userId}/queue/messages`, (message) => {
        try {
          const parsedMessage = JSON.parse(message.body);
          console.log('Raw WebSocket response:', parsedMessage);
          const normalizedMessage = {
            id: parsedMessage._id || parsedMessage.id,
            senderId: parsedMessage.senderId,
            receiverId: parsedMessage.receiverId,
            groupId: parsedMessage.groupId,
            content: parsedMessage.content,
            type: parsedMessage.type || 'TEXT',
            createAt: parsedMessage.createdAt || parsedMessage.createAt || new Date().toISOString(),
            recalled: parsedMessage.recalled || false,
            deletedByUsers: parsedMessage.deletedByUsers || [],
            isRead: parsedMessage.isRead || false,
            isPinned: parsedMessage.isPinned || false,
            fileName: parsedMessage.fileName || '',
            thumbnail: parsedMessage.thumbnail || '',
            publicId: parsedMessage.publicId || '',
            isEdited: parsedMessage.isEdited || false,
          };
          const deletedMessageIds = JSON.parse(localStorage.getItem('deletedMessageIds') || '[]');
          if (!deletedMessageIds.includes(normalizedMessage.id)) {
            onMessageCallback(normalizedMessage);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      }, { Authorization: `Bearer ${token}` });

      // Subscription cho tin nhắn nhóm
      groupIds.forEach(groupId => {
        if (groupId) {
          stompClient.subscribe(`/topic/group/${groupId}`, (message) => {
            try {
              const parsedMessage = JSON.parse(message.body);
              console.log('Raw group WebSocket response:', parsedMessage);
              const normalizedMessage = {
                id: parsedMessage._id || parsedMessage.id,
                senderId: parsedMessage.senderId,
                receiverId: parsedMessage.receiverId,
                groupId: parsedMessage.groupId,
                content: parsedMessage.content,
                type: parsedMessage.type || 'TEXT',
                createAt: parsedMessage.createdAt || parsedMessage.createAt || new Date().toISOString(),
                recalled: parsedMessage.recalled || false,
                deletedByUsers: parsedMessage.deletedByUsers || [],
                isRead: parsedMessage.isRead || false,
                isPinned: parsedMessage.isPinned || false,
                fileName: parsedMessage.fileName || '',
                thumbnail: parsedMessage.thumbnail || '',
                publicId: parsedMessage.publicId || '',
                isEdited: parsedMessage.isEdited || false,
              };
              const deletedMessageIds = JSON.parse(localStorage.getItem('deletedMessageIds') || '[]');
              if (!deletedMessageIds.includes(normalizedMessage.id)) {
                onMessageCallback(normalizedMessage);
              }
            } catch (error) {
              console.error('Error parsing group message:', error);
            }
          }, { Authorization: `Bearer ${token}` });
        } else {
          console.warn('Skipping subscription for undefined groupId');
        }
      });

      // Subscription cho thông báo xóa
      stompClient.subscribe(`/user/${userId}/queue/delete`, (message) => {
        try {
          const parsedMessage = JSON.parse(message.body);
          console.log('Delete notification:', parsedMessage);
          if (parsedMessage._id) {
            parsedMessage.id = parsedMessage._id;
            delete parsedMessage._id;
          }
          onDeleteCallback(parsedMessage);
        } catch (error) {
          console.error('Error parsing delete notification:', error);
        }
      }, { Authorization: `Bearer ${token}` });

      // Subscription cho thông báo thu hồi
      stompClient.subscribe(`/user/${userId}/queue/recall`, (message) => {
        try {
          const parsedMessage = JSON.parse(message.body);
          console.log('Recall notification:', parsedMessage);
          if (parsedMessage._id) {
            parsedMessage.id = parsedMessage._id;
            delete parsedMessage._id;
          }
          onRecallCallback(parsedMessage);
        } catch (error) {
          console.error('Error parsing recall notification:', error);
        }
      }, { Authorization: `Bearer ${token}` });

      // Subscription cho thông báo ghim tin nhắn
      stompClient.subscribe(`/user/${userId}/queue/pin`, (message) => {
        try {
          const parsedMessage = JSON.parse(message.body);
          console.log('Pin notification:', parsedMessage);
          if (parsedMessage._id) {
            parsedMessage.id = parsedMessage._id;
            delete parsedMessage._id;
          }
          if (onPinCallback) {
            onPinCallback(parsedMessage);
          } else {
            console.warn('onPinCallback is not defined');
          }
        } catch (error) {
          console.error('Error parsing pin notification:', error);
        }
      }, { Authorization: `Bearer ${token}` });

      // Subscription cho thông báo bỏ ghim tin nhắn
      stompClient.subscribe(`/user/${userId}/queue/unpin`, (message) => {
        try {
          const parsedMessage = JSON.parse(message.body);
          console.log('Unpin notification:', parsedMessage);
          if (parsedMessage._id) {
            parsedMessage.id = parsedMessage._id;
            delete parsedMessage._id;
          }
          if (onUnpinCallback) {
            onUnpinCallback(parsedMessage);
          } else {
            console.warn('onUnpinCallback is not defined');
          }
        } catch (error) {
          console.error('Error parsing unpin notification:', error);
        }
      }, { Authorization: `Bearer ${token}` });

      // Subscription cho thông báo chỉnh sửa tin nhắn
      stompClient.subscribe(`/user/${userId}/queue/edit`, (message) => {
        try {
          const parsedMessage = JSON.parse(message.body);
          console.log('Edit notification:', parsedMessage);
          if (parsedMessage._id) {
            parsedMessage.id = parsedMessage._id;
            delete parsedMessage._id;
          }
          if (onEditCallback) {
            onEditCallback(parsedMessage);
          } else {
            console.warn('onEditCallback is not defined');
          }
        } catch (error) {
          console.error('Error parsing edit notification:', error);
        }
      }, { Authorization: `Bearer ${token}` });

      // Subscription cho thông báo yêu cầu kết bạn
      stompClient.subscribe(`/user/${userId}/queue/friendRequest`, (message) => {
        try {
          const parsedMessage = JSON.parse(message.body);
          console.log('Friend request notification:', parsedMessage);
          if (onFriendRequestCallback) {
            onFriendRequestCallback(parsedMessage);
          } else {
            console.warn('onFriendRequestCallback is not defined');
          }
        } catch (error) {
          console.error('Error parsing friend request notification:', error);
        }
      }, { Authorization: `Bearer ${token}` });

      resolve();
    };

    stompClient.onStompError = (frame) => {
      console.error('STOMP error:', frame);
      reject(new Error(`STOMP error: ${frame.body || frame.headers?.message || 'Unknown error'}`));
    };

    stompClient.onWebSocketClose = (event) => {
      console.log('SockJS disconnected:', event);
      stompClient = null;
    };

    stompClient.onWebSocketError = (error) => {
      console.error('SockJS error:', error);
      reject(new Error(`SockJS error: ${error.message || 'Connection failed'}`));
    };

    console.log('Connecting STOMP with token:', token.substring(0, 20) + '...');
    stompClient.activate();
  });
}

// Hàm gửi tin nhắn 1-1
export function sendMessage(destination, message, token) {
  if (!stompClient || !stompClient.connected) {
    console.error('Cannot send message: STOMP client is not connected');
    return false;
  }

  try {
    stompClient.publish({
      destination,
      body: JSON.stringify(message),
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Sent message to', destination, ':', message);
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

// Hàm gửi tin nhắn nhóm
export function sendGroupMessage(destination, message, token) {
  if (!stompClient || !stompClient.connected) {
    console.error('Cannot send group message: STOMP client is not connected');
    return false;
  }

  try {
    stompClient.publish({
      destination,
      body: JSON.stringify(message),
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Sent group message to', destination, ':', message);
    return true;
  } catch (error) {
    console.error('Error sending group message:', error);
    return false;
  }
}

// Hàm thu hồi tin nhắn
export function recallMessage(identifier, userId, token) {
  if (!stompClient || !stompClient.connected) {
    console.error('Cannot recall message: STOMP client is not connected');
    return false;
  }

  try {
    const message = { id: identifier, senderId: userId };
    stompClient.publish({
      destination: '/app/chat.recall',
      body: JSON.stringify(message),
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Recalled message:', identifier);
    return true;
  } catch (error) {
    console.error('Error recalling message:', error);
    return false;
  }
}

// Hàm xóa tin nhắn
export function deleteMessage(identifier, userId, token) {
  if (!stompClient || !stompClient.connected) {
    console.error('Cannot delete message: STOMP client is not connected');
    return false;
  }

  try {
    const message = { id: identifier, senderId: userId };
    stompClient.publish({
      destination: '/app/chat.delete',
      body: JSON.stringify(message),
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Deleted message:', identifier);
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
}

// Hàm chuyển tiếp tin nhắn
export function forwardMessage(identifier, userId, receiverId, groupId, content, token) {
  if (!stompClient || !stompClient.connected) {
    console.error('Cannot forward message: STOMP client is not connected');
    return false;
  }
  try {
    const message = {
      id: identifier,
      senderId: userId,
      receiverId,
      groupId,
      content,
      type: 'FORWARD'
    };
    stompClient.publish({
      destination: '/app/chat.forward',
      body: JSON.stringify(message),
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Forwarded message:', identifier, 'to', receiverId || groupId);
    return true;
  } catch (error) {
    console.error('Error forwarding message:', error);
    return false;
  }
}

// Hàm ngắt kết nối
export function disconnectWebSocket() {
  if (stompClient && stompClient.connected) {
    console.log('Disconnecting STOMP');
    stompClient.deactivate();
    stompClient = null;
  } else {
    console.log('No active STOMP connection to disconnect');
  }
}