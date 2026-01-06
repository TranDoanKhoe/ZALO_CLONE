import React, { useState } from "react";
import { Box, TextField, Button, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, MenuItem, Snackbar, Alert } from "@mui/material";
import { updateUserProfile } from "../../api/user";

const UpdateProfileForm = ({ profileData, onSubmit, onCancel }) => {
  const [firstName, setFirstName] = useState(profileData?.firstName || "");
  const [lastName, setLastName] = useState(profileData?.lastName || "");
  const [email, setEmail] = useState(profileData?.email || "");
  const [phone, setPhone] = useState(profileData?.phone || "");
  const [day, setDay] = useState(profileData?.birthday?.split("-")[2] || "");
  const [month, setMonth] = useState(profileData?.birthday?.split("-")[1] || "");
  const [year, setYear] = useState(profileData?.birthday?.split("-")[0] || "");
  const [gender, setGender] = useState(profileData?.gender || "");
  const [avatar, setAvatar] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const handleAvatarChange = (e) => {
    setAvatar(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;


    const updatedData = {
      userId: profileData?.userId,
      firstName,
      lastName,
      email,
      phone,
      gender,
      birthday: formattedDate,
      avatar, // sẽ cần xử lý multipart nếu backend yêu cầu
    };

    try {
      const result = await updateUserProfile(updatedData);
      if (result) {
        setSnackbarMessage("Cập nhật hồ sơ thành công!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        onSubmit(result);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setSnackbarMessage("Có lỗi khi cập nhật hồ sơ vui lòng kiểm tra lại.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error(error);
      setSnackbarMessage("Đã xảy ra lỗi khi cập nhật hồ sơ.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Thông tin cơ bản */}
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Họ"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Tên"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Số điện thoại"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
      </Box>

      {/* Ngày sinh */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          select
          label="Ngày"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          sx={{ width: "30%" }}
        >
          {[...Array(31)].map((_, i) => (
            <MenuItem key={i + 1} value={String(i + 1)}>{i + 1}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Tháng"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          sx={{ width: "30%" }}
        >
          {[...Array(12)].map((_, i) => (
            <MenuItem key={i + 1} value={String(i + 1).padStart(2, "0")}>{i + 1}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Năm"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          sx={{ width: "40%" }}
        >
          {[...Array(100)].map((_, i) => {
            const yearValue = String(new Date().getFullYear() - i);
            return <MenuItem key={yearValue} value={yearValue}>{yearValue}</MenuItem>;
          })}
        </TextField>
      </Box>

      {/* Giới tính */}
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend">Giới tính</FormLabel>
        <RadioGroup row name="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
          <FormControlLabel value="MALE" control={<Radio />} label="Nam" />
          <FormControlLabel value="FEMALE" control={<Radio />} label="Nữ" />
          <FormControlLabel value="OTHER" control={<Radio />} label="Khác" />
        </RadioGroup>
      </FormControl>

      {/* Ảnh đại diện */}
      <Box sx={{ mb: 2 }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          style={{ display: "none" }}
        />
      </Box>

      {/* Nút Submit / Cancel */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="contained" color="primary" fullWidth type="submit" >

          Lưu thay đổi
        </Button>
        <Button variant="outlined" color="primary" fullWidth onClick={onCancel}>
          Hủy bỏ
        </Button>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UpdateProfileForm;
