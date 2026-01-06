import React, { useState } from "react";
import { Modal, Paper, Box, Avatar, Typography, Divider, Button, CircularProgress, Snackbar, Alert } from "@mui/material";
import { styled } from "@mui/material/styles";
import UpdateProfileForm from "./UpdateProfileForm";
import { updateUserProfile } from "../../api/user";
import CameraAltIcon from '@mui/icons-material/CameraAlt';

const ProfileModalStyled = styled(Modal)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const ProfileContent = styled(Paper)(({ theme }) => ({
  position: "relative",
  width: 450,
  maxWidth: "90vw",
  maxHeight: "85vh",
  overflowY: "auto",
  backgroundColor: theme.palette.background.paper,
  borderRadius: 12,
  padding: theme.spacing(4),
  boxShadow: theme.shadows[5],
  outline: "none",
}));

const getGenderLabel = (gender) => {
  switch (gender) {
    case "MALE":
      return "Nam";
    case "FEMALE":
      return "Nữ";
    default:
      return "Khác";
  }
};

const ProfileModal = ({ open, onClose, profileData, userProfile, setUserProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [isAvatarZoomed, setIsAvatarZoomed] = useState(false);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleProfileUpdate = async (event, formData) => {
    event.preventDefault();
    setLoading(true);

    try {
      const avatarFile = document.getElementById("profile-image-upload")?.files[0];

      if (!avatarFile) {
        console.warn("No avatar file selected");
      }

      const updatedProfile = {
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        phone: userProfile.phone,
        gender: formData.get("gender"),
        birthday: formData.get("birthday"),
        avatar: avatarFile,
      };

      const result = await updateUserProfile(updatedProfile);

      if (result) {
        setUserProfile(result);
        setIsEditing(false);
        setSnackbar({ open: true, message: "Cập nhật hồ sơ thành công!", severity: "success" });
        onClose();
      } else {
         setSnackbar({ open: true, message: "Cập nhật hồ sơ thất bại.", severity: "error" });
      }
    } catch (error) {
      console.error("Update profile failed:", error);
      setSnackbar({ open: true, message: "Có lỗi xảy ra khi cập nhật hồ sơ.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      try {
        const updatedProfile = {
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          email: userProfile.email,
          phone: userProfile.phone,
          gender: userProfile.gender,
          birthday: userProfile.birthday,
          avatar: file,
        };
        const result = await updateUserProfile(updatedProfile);
        if (result) {
          setUserProfile(result);
          setSnackbar({ open: true, message: "Cập nhật ảnh đại diện thành công!", severity: "success" });
        } else {
           setSnackbar({ open: true, message: "Cập nhật ảnh đại diện thất bại.", severity: "error" });
        }
      } catch (error) {
        console.error("Avatar upload failed:", error);
        setSnackbar({ open: true, message: "Có lỗi khi tải ảnh đại diện.", severity: "error" });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAvatarClick = () => {
    setIsAvatarZoomed(true);
  };

  const handleCloseZoom = () => {
    setIsAvatarZoomed(false);
  };

  const renderProfileContent = () => {
    const data = userProfile || profileData;
    if (!data) return null;

    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <Box position="relative" display="inline-block">
          <Box position="relative" display="inline-block">
            <Avatar
              src={data.avatar}
              sx={{
                width: 140,
                height: 140,
                marginBottom: 1,
                cursor: "pointer",
                border: "3px solid",
                borderColor: "primary.main",
                transition: "transform 0.3s ease, opacity 0.3s ease",
                "&:hover": { opacity: 0.9, transform: "scale(1.05)" },
              }}
              onClick={handleAvatarClick}
            />
            {loading && (
              <CircularProgress
                size={50}
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  marginTop: "-25px",
                  marginLeft: "-25px",
                  color: "primary.main",
                }}
              />
            )}
          </Box>

          {userProfile && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '50%',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 1,
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
              }}
              onClick={() => document.getElementById('profile-image-upload')?.click()}
            >
              <CameraAltIcon fontSize="small" color="primary" />
            </Box>
          )}
        </Box>

        <input
          type="file"
          id="profile-image-upload"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />

        <Typography variant="h4" fontWeight="bold" color="textPrimary">
          {`${data.firstName || ""} ${data.lastName || ""}`.trim() || "N/A"}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Trạng thái: {data.status || "Không xác định"}
        </Typography>

        <Divider sx={{ my: 3, width: "100%" }} />

        <Box width="100%" textAlign="left" px={2}>
          <Typography variant="body1" gutterBottom>
            <strong>Email:</strong> {data.email || "N/A"}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Họ và Tên:</strong> {`${data.firstName || ""} ${data.lastName || ""}`.trim() || "N/A"}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Ngày sinh:</strong>
            {data.birthday ? new Date(data.birthday).toLocaleDateString("vi-VN") : "N/A"}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Giới tính:</strong> {getGenderLabel(data.gender)}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Số điện thoại:</strong> {data.phone || "N/A"}
          </Typography>
        </Box>

        {userProfile && (
          <Box width="100%" mt={3}>
            {isEditing ? (
              <UpdateProfileForm
                profileData={data}
                onSubmit={handleProfileUpdate}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => setIsEditing(true)}
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: "medium",
                  borderRadius: 8,
                  textTransform: "none",
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Chỉnh sửa hồ sơ"}
              </Button>

            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <>
      <ProfileModalStyled open={open} onClose={onClose} aria-labelledby="profile-modal">
        <ProfileContent>{renderProfileContent()}</ProfileContent>
      </ProfileModalStyled>

      <Modal open={isAvatarZoomed} onClose={handleCloseZoom} closeAfterTransition>
        <Box
          onClick={handleCloseZoom}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'zoom-out',
          }}
        >
          <Box
            component="img"
            src={userProfile?.avatar || profileData?.avatar}
            alt="Ảnh đại diện phóng to"
            sx={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
            }}
          />
        </Box>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProfileModal;