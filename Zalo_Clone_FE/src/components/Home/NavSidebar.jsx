import React, { useState } from "react";
import {
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Typography,
} from "@mui/material";
import { BiMessageSquareDetail, BiUser, BiCog, BiLogOut, BiExit } from "react-icons/bi";
import { styled } from "@mui/material/styles";


const NavSidebarContainer = styled(Box)(({ theme }) => ({
  backgroundColor: "#0068ff",
  width: 90,
  borderRight: "1px solid",
  borderColor: theme.palette.divider,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: theme.spacing(2),
  bgcolor: "#0088cc",
  color: "white",
}));

const CustomMenuItem = ({ icon, label, onClick, color = "inherit" }) => (
  <MenuItem onClick={onClick} sx={{ color }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {icon}
      <Typography variant="body2">{label}</Typography>
    </Box>
  </MenuItem>
);

const NavSidebar = ({
  userProfile,
  currentView,
  onViewChange,
  onProfileOpen,
  onLogout,
  onOpenChangePasswordModal,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <NavSidebarContainer>
      <Avatar
        src={userProfile?.avatar || ""}
        sx={{
          width: 56,
          height: 56,
          mb: 3,
          cursor: "pointer",
          bgcolor: !userProfile?.avatar ? "#ffffff30" : "transparent",
        }}
        onClick={onProfileOpen}
      />
      <Box
        sx={{

          display: "flex",
          flexDirection: "column",
          flex: 1,
          alignItems: "center",
        }}
      >
        <IconButton
          sx={{
            mb: 2,
            color:
              currentView === "messages"
                ? "#ffffff"
                : "rgba(255,255,255,0.7)",
          }}
          onClick={() => onViewChange("messages")}
        >
          <BiMessageSquareDetail fontSize="32px" />
        </IconButton>
        <IconButton
          sx={{
            mb: 2,
            color:
              currentView === "contacts"
                ? "#ffffff"
                : "rgba(255,255,255,0.7)",
          }}
          onClick={() => onViewChange("contacts")}
        >
          <BiUser fontSize="32px" />
        </IconButton>
        <Box sx={{ mt: "auto" }}>
          <IconButton
            sx={{
              color:
                currentView === "settings"
                  ? "#ffffff"
                  : "rgba(255,255,255,0.7)",
            }}
            onClick={handleMenuOpen}
          >
            <BiCog fontSize="32px" />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <CustomMenuItem
              icon={<BiUser fontSize="30px" />}
              label="Thông tin tài khoản"
              onClick={() => {
                onProfileOpen();
                handleMenuClose();
              }}
            />
            <CustomMenuItem
              icon={<BiCog fontSize="30px" />}
              label="Đổi mật khẩu"
              onClick={() => {
                handleMenuClose();
                onOpenChangePasswordModal();
              }}
            />
            <CustomMenuItem
              icon={<BiLogOut  fontSize="30px"/>}
              label="Đăng xuất"
              onClick={() => {
                onLogout();
                handleMenuClose();
              }}
              color="red"
            />
          </Menu>
        </Box>
      </Box>
    </NavSidebarContainer>
  );
};

export default NavSidebar;
