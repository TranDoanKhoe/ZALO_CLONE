import axios from 'axios';

const API_BASE_URL = '/api/group';

export const createGroup = async (name, memberIds, avatarGroup, token) => {
    if (!token) {
        throw new Error('Token is missing');
    }
    const userId = localStorage.getItem('userId') || '680e6d95a73e35151128bf65';
    const finalMemberIds = [...new Set([...memberIds, userId])];
    try {
        const response = await axios.post(
            API_BASE_URL,
            {
                name,
                createId: userId,
                memberIds: finalMemberIds,
                avatarGroup: avatarGroup,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            },
        );
        console.log('Create group response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating group:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        throw error;
    }
};

export const fetchUserGroups = async (userId, token) => {
    if (!token) {
        throw new Error('Token is missing');
    }
    try {
        const response = await axios.get(`${API_BASE_URL}/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetch groups response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching groups:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        throw error;
    }
};

export const fetchGroupMembers = async (groupId, token) => {
    if (!token) {
        throw new Error('Token is missing');
    }
    try {
        const response = await axios.get(`${API_BASE_URL}/${groupId}/members`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetch group members response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching group members:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        throw error;
    }
};

export const addGroupMembers = async (groupId, userIds, token) => {
    if (!token) {
        throw new Error('Token is missing');
    }
    try {
        const response = await axios.post(
            `${API_BASE_URL}/${groupId}/members`,
            userIds,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            },
        );
        console.log('Add group members response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error adding group members:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        throw error;
    }
};

export const removeGroupMember = async (groupId, userId, token) => {
    if (!token) {
        throw new Error('Token is missing');
    }
    try {
        const response = await axios.delete(
            `${API_BASE_URL}/${groupId}/members/${userId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            },
        );
        console.log('Remove group member response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error removing group member:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        throw error;
    }
};

export const dissolveGroup = async (groupId, token) => {
    if (!token) {
        throw new Error('Token is missing');
    }
    try {
        const response = await axios.delete(`${API_BASE_URL}/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Dissolve group response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error dissolving group:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        throw error;
    }
};

export const assignGroupRole = async (groupId, userId, role, token) => {
    if (!token) {
        throw new Error('Token is missing');
    }
    try {
        const response = await axios.put(
            `${API_BASE_URL}/${groupId}/roles/${userId}`,
            {},
            {
                headers: { Authorization: `Bearer ${token}` },
                params: { role },
            },
        );
        console.log('Assign group role response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error assigning group role:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        throw error;
    }
};
//loc thanh vien trong nhom
export const fetchEligibleFriends = async (groupId, token) => {
    const response = await axios.get(
        `${API_BASE_URL}/${groupId}/eligible-members`,
        {
            headers: { Authorization: `Bearer ${token}` },
        },
    );
    return response.data;
};

export const addMembersToGroup = async (groupId, memberIds, token) => {
    const response = await axios.post(
        `${API_BASE_URL}/${groupId}/members`,
        memberIds, // Là 1 mảng userId
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        },
    );
    return response.data;
};
export const addAllFriendsToGroup = async (groupId, token) => {
    if (!token) throw new Error('Token is missing');

    try {
        // Lấy danh sách bạn bè có thể thêm
        const eligibleFriends = await fetchEligibleFriends(groupId, token);
        const eligibleIds = eligibleFriends.map((friend) => friend.id);

        if (eligibleIds.length === 0) {
            console.log('Không có bạn bè nào để thêm vào nhóm.');
            return;
        }

        // Gửi API để thêm
        const updatedGroup = await addMembersToGroup(
            groupId,
            eligibleIds,
            token,
        );
        console.log('Đã thêm bạn bè vào nhóm:', updatedGroup);
        return updatedGroup;
    } catch (err) {
        console.error('Lỗi khi thêm bạn bè vào nhóm:', err);
        throw err;
    }
};

export const updateGroupInfo = async (groupId, updates, token) => {
    if (!token) {
        throw new Error('Token is missing');
    }
    try {
        const formData = new FormData();

        // Thêm tên nhóm nếu có
        if (updates.name) {
            formData.append('name', updates.name);
        }

        // Xử lý avatar - convert base64 thành file nếu có
        if (updates.avatarGroup) {
            // Nếu là base64, chuyển thành blob
            if (updates.avatarGroup.startsWith('data:image')) {
                const base64Data = updates.avatarGroup.split(',')[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'image/jpeg' });
                const file = new File([blob], 'avatar.jpg', {
                    type: 'image/jpeg',
                });
                formData.append('avatarGroup', file);
            }
        }

        const response = await axios.put(
            `${API_BASE_URL}/${groupId}`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            },
        );
        console.log('Update group info response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error updating group info:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
        throw error;
    }
};
