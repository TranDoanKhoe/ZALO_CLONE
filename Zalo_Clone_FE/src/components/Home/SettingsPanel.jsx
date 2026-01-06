import React from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Modal,
  Fade,
  Backdrop,
} from "@mui/material";
import { updatePassword } from "../../api/user";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

const SettingsPanel = ({ open, onClose }) => {


  const handleUpdatePassword = async () => {
    const oldPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const isMaxLength = newPassword.length <= 10;

    if (!hasUpperCase || !isMaxLength) {
      alert("Mật khẩu phải có ít nhất 1 ký tự in hoa và tối đa 10 ký tự");
      return;
    }

    const result = await updatePassword(oldPassword, newPassword);
    if (result) {
      alert("Password updated successfully");
      onClose();
    } else {
      alert("Failed to update password");
    }
  };

  return (
    <Modal
    open={open}
    onClose={onClose}
    closeAfterTransition
    slots={{ backdrop: Backdrop }}
    slotProps={{
      backdrop: { timeout: 300 },
    }}
  >
    <Fade in={open}>
      <Box sx={style}>
        <Typography variant="h6" mb={2}>
          Change Password
        </Typography>
        <TextField
          fullWidth
          type="password"
          label="Current Password"
          margin="normal"
          id="currentPassword"
        />
        <TextField
          fullWidth
          type="password"
          label="New Password"
          margin="normal"
          id="newPassword"
        />
        <TextField
          fullWidth
          type="password"
          label="Confirm New Password"
          margin="normal"
          id="confirmPassword"
        />
        <Box mt={2} display="flex" justifyContent="space-between">
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdatePassword}>
            Update
          </Button>
        </Box>
      </Box>
    </Fade>
  </Modal>
  );
};

export default SettingsPanel;
