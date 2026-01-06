import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Container
} from '@mui/material';
import { sendVerificationEmail, verifyEmailWithCode } from '../api/user';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const StyledContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '300px',
  width: '100%'
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  borderRadius: 16,
  backgroundColor: '#ffffff',
  border: '1px solid #b3e5fc',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
}));

const VerifyEmail = ({ email, registerData, onSuccess, onBack }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [codeSent, setCodeSent] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Gửi mã xác thực đến email
  const handleSendCode = async () => {
    setLoading(true);
    setError(null);
    try {
      await sendVerificationEmail(email);
      setCodeSent(true);
      setSuccess('Mã xác thực đã được gửi đến email của bạn');
      setLoading(false);
    } catch (error) {
      setError('Không thể gửi mã xác thực. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };
  // Xác thực mã code
  const handleVerify = async () => {
    if (!code || code.trim() === '') {
      setError('Vui lòng nhập mã xác thực');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Đảm bảo registerData có đầy đủ thông tin theo UserRegisterRequest
      const updatedRegisterData = {
        ...registerData,
        username: registerData.username,
        password: registerData.password,
        email: email,
        phone: registerData.phone || '',
        firstName: registerData.firstName || '',
        lastName: registerData.lastName || '',
        gender: registerData.gender || 'MALE',
        birthday: registerData.birthday || null,
        avatar: registerData.avatar || 'default-avatar'
      };
      
      const response = await verifyEmailWithCode(email, code, updatedRegisterData);
      
      // Lưu token xác thực
      if (response.accessToken) localStorage.setItem('accessToken', response.accessToken);
      if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
      if (response.userId) localStorage.setItem('userId', response.userId);
        setLoading(false);
      setSuccess('Đăng ký thành công! Chuyển hướng đến trang đăng nhập...');
      
      // Xóa token khỏi localStorage vì ta muốn người dùng đăng nhập lại
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      
      // Chờ 2 giây cho người dùng đọc thông báo thành công, sau đó chuyển hướng
      setTimeout(() => {
        // Nếu có callback thì gọi
        if (onSuccess) {
          onSuccess(response);
        } 
        // Chuyển đến trang đăng nhập với thông tin đăng ký thành công
        navigate('/', { 
          state: { 
            registrationSuccess: true,
            email: email 
          }
        });
      }, 2000);
    } catch (error) {
      setError('Mã xác thực không đúng hoặc đã hết hạn.');
      setLoading(false);
    }
  };

  return (
    <StyledContainer maxWidth="sm">
      <StyledPaper elevation={3}>
        <Typography variant="h5" align="center" gutterBottom sx={{ mb: 3 }}>
          Xác thực email
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, width: '100%' }}>{success}</Alert>}
        
        <Box sx={{ mb: 2, width: '100%' }}>
          <Typography variant="body2" sx={{ mb: 1, textAlign: 'center' }}>
            {codeSent 
              ? `Mã xác thực đã được gửi đến email ${email}` 
              : `Nhấn nút bên dưới để gửi mã xác thực đến email ${email}`}
          </Typography>
          
          {!codeSent && (
            <Button 
              fullWidth 
              variant="contained" 
              color="primary"
              onClick={handleSendCode}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Gửi mã xác thực'}
            </Button>
          )}
          
          {codeSent && (
            <>
              <TextField
                fullWidth
                label="Mã xác thực"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                margin="normal"
                required
              />
              
              <Button 
                fullWidth 
                variant="contained" 
                color="primary"
                onClick={handleVerify}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Xác thực'}
              </Button>
              
              <Button
                fullWidth
                color="secondary"
                onClick={handleSendCode}
                disabled={loading}
                sx={{ mt: 1 }}
              >
                Gửi lại mã
              </Button>
            </>
          )}
          
          <Button
            fullWidth
            variant="outlined"
            onClick={onBack}
            sx={{ mt: 2 }}
          >
            Quay lại đăng ký
          </Button>
        </Box>
      </StyledPaper>
    </StyledContainer>
  );
};

export default VerifyEmail;
