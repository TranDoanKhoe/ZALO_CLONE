const API_BASE_URL =
    import.meta.env.VITE_API_URL || "/api";

import axios from "axios";

export const fetchUserProfile = async() => {
    try {
        const response = await fetch(`${API_BASE_URL}/user/get-info-for-user`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to fetch profile");
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

export const updateUserProfile = async(data) => {
    try {
        const formData = new FormData();
        const requestData = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            gender: data.gender,
            birthday: data.birthday,
        };
        formData.append("request", new Blob([JSON.stringify(requestData)], { type: "application/json" }));
        if (data.avatar) {
            formData.append("avatar", data.avatar);
        }
        const response = await axios.put("/api/user/update", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Update profile failed", error);
        return null;
    }
};

export const updatePassword = async(oldPassword, newPassword) => {
    try {
        const response = await fetch(`${API_BASE_URL}/user/change-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify({
                oldPassword,
                newPassword,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to update password");
        }
        return response.json();
    } catch (error) {
        console.error("Error updating password:", error);
        return null;
    }
};

export const uploadAvatar = async(file) => {
    try {
        const formData = new FormData();
        formData.append("avatar", file);
        const response = await fetch(`${API_BASE_URL}/user/upload-avatar`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: formData,
        });
        if (!response.ok) {
            throw new Error("Upload failed");
        }
        return response.json();
    } catch (error) {
        console.error("Upload error:", error);
        return null;
    }
};

export const fetchFriendsList = async() => {
    try {
        const response = await fetch(`/api/friend`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to fetch friends list");
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching friends list:", error);
        return null;
    }
};

export const fetchPendingFriendRequests = async() => {
    try {
        const response = await fetch(`/api/friend/requests/pending`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to fetch pending friend requests");
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching pending friend requests:", error);
        return null;
    }
};

export const sendFriendRequest = async(phone) => {
    try {
        const response = await fetch(`/api/friend/send-request/${phone}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Gửi yêu cầu kết bạn thất bại");
        }
        return response.json();
    } catch (error) {
        console.error("Lỗi gửi yêu cầu kết bạn:", error);
        throw error;
    }
};

export const acceptFriendRequest = async(requestId) => {
    try {
        const response = await fetch(`/api/friend/request/${requestId}/accept`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            let errorMessage = "Chấp nhận yêu cầu kết bạn thất bại";
            if (contentType && contentType.includes("application/json")) {
                const error = await response.json();
                errorMessage = error.message || errorMessage;
            } else {
                const text = await response.text();
                console.warn("Non-JSON response received:", text);
                errorMessage = text || errorMessage;
            }
            throw new Error(errorMessage);
        }
        return response.json();
    } catch (error) {
        console.error("Lỗi chấp nhận yêu cầu kết bạn:", error);
        throw error;
    }
};

export const cancelFriendRequest = async(requestId) => {
    try {
        const response = await fetch(`/api/friend/request/${requestId}/cancel`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to cancel friend request");
        }

        return response.json();
    } catch (error) {
        console.error("Error canceling friend request:", error);
        return null;
    }
};

export const deleteFriend = async(friendId) => {
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            throw new Error("Vui lòng đăng nhập để xóa bạn bè");
        }
        const currentUserId = localStorage.getItem('userId');
        if (friendId === currentUserId) {
            throw new Error("Bạn không thể xóa chính mình khỏi danh sách bạn bè");
        }
        const response = await fetch(`/api/friend/${friendId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            let errorMessage = "Không thể xóa bạn bè";
            if (response.status === 403) {
                errorMessage = "Bạn không có quyền xóa bạn bè này";
            } else if (response.status === 404) {
                errorMessage = "Người dùng không tồn tại hoặc không phải bạn bè";
            } else {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    console.warn("Non-JSON response received:", await response.text());
                }
            }
            throw new Error(errorMessage);
        }
        return response.json();
    } catch (error) {
        console.error("Error deleting friend:", error);
        throw error;
    }
};

export const blockUser = async(blockedUserId) => {
    try {
        const response = await fetch(`/api/friend/block/${blockedUserId}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to block user");
        }
        return response.json();
    } catch (error) {
        console.error("Error blocking user:", error);
        return null;
    }
};

export const unblockUser = async(blockedUserId) => {
    try {
        const response = await fetch(`/api/friend/unblock/${blockedUserId}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to unblock user");
        }
        return response.json();
    } catch (error) {
        console.error("Error unblocking user:", error);
        return null;
    }
};

export const getFriendById = async(friendId) => {
    try {
        const response = await fetch(`/api/friend/${friendId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to fetch friend details");
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching friend details:", error);
        return null;
    }
};

export const resetPassword = async(email) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/reset-password`, { email });
        return response.data;
    } catch (error) {
        console.error("Error resetting password:", error);
        throw error;
    }
};

// API để gửi email xác thực
export const sendVerificationEmail = async(email) => {
    try {
        // Đảm bảo email được gửi đúng định dạng
        const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain"
            },
            body: email
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Error from server:", errorData);
            throw new Error("Không thể gửi email xác thực");
        }

        return true;
    } catch (error) {
        console.error("Lỗi khi gửi email xác thực:", error);
        throw error;
    }
};

// API để xác thực email bằng mã code
export const verifyEmailWithCode = async(email, code, userRegisterRequest) => {
    try {
        console.log("Gửi yêu cầu xác thực email:", {
            email,
            code,
            userRegisterRequest
        });

        const response = await fetch(`${API_BASE_URL}/auth/verify-email-code`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                code: code,
                userRegisterRequest: userRegisterRequest
            })
        });

        if (!response.ok) {
            let errorMessage = "Xác thực email thất bại";
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // Nếu phản hồi không phải JSON, sử dụng thông báo mặc định
            }
            throw new Error(errorMessage);
        }

        return response.json();
    } catch (error) {
        console.error("Lỗi khi xác thực email:", error);
        throw error;
    }
};

export const fetchUserByPhone = async(phone) => {
    try {
        const response = await fetch(`${API_BASE_URL}/user/get-user-by-phone/${phone}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Không tìm thấy người dùng với số điện thoại này");
            }

            // Try to parse error message from response
            try {
                const errorData = await response.json();
                throw new Error(errorData.message || "Không thể tìm người dùng");
            } catch (jsonError) {
                throw new Error("Không thể tìm người dùng với số điện thoại này");
            }
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching user by phone:", error);
        throw error;
    }
};