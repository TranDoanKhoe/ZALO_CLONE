import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    styled,
} from '@mui/material';
import { BiLock, BiCamera, BiMicrophone } from 'react-icons/bi';

const GuideStep = styled(Box)({
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '12px',
});

const IconBox = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    color: '#ff3b30',
});

const PermissionGuideModal = ({ open, onClose, onRetry }) => {
    return (
        <Dialog open={open} maxWidth="sm" fullWidth>
            <DialogTitle>
                <IconBox>
                    <BiLock size={28} />
                    <Typography variant="h6" fontWeight={600}>
                        Cần quyền truy cập Microphone/Camera
                    </Typography>
                </IconBox>
            </DialogTitle>

            <DialogContent>
                <Typography variant="body1" paragraph>
                    Để thực hiện cuộc gọi, bạn cần cho phép ứng dụng truy cập
                    microphone và camera của bạn.
                </Typography>

                <GuideStep>
                    <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        gutterBottom
                    >
                        Bước 1: Tìm icon ổ khóa
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Nhìn lên thanh địa chỉ URL của trình duyệt, bạn sẽ thấy
                        icon ổ khóa 🔒 hoặc 🛈 bên trái URL
                    </Typography>
                </GuideStep>

                <GuideStep>
                    <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        gutterBottom
                    >
                        Bước 2: Click vào icon
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Click vào icon đó để mở menu cài đặt quyền
                    </Typography>
                </GuideStep>

                <GuideStep>
                    <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        gutterBottom
                    >
                        Bước 3: Cho phép quyền
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Tìm và bật quyền cho:
                    </Typography>
                    <Box sx={{ mt: 1, ml: 2 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 0.5,
                            }}
                        >
                            <BiMicrophone size={18} />
                            <Typography variant="body2">
                                Microphone (Bắt buộc)
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <BiCamera size={18} />
                            <Typography variant="body2">
                                Camera (Cho cuộc gọi video)
                            </Typography>
                        </Box>
                    </Box>
                </GuideStep>

                <GuideStep>
                    <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        gutterBottom
                    >
                        Bước 4: Thử lại
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Sau khi cho phép, click nút "Thử lại" bên dưới
                    </Typography>
                </GuideStep>

                <Box
                    sx={{
                        mt: 2,
                        p: 2,
                        backgroundColor: '#fff3cd',
                        borderRadius: 1,
                    }}
                >
                    <Typography variant="caption" color="text.secondary">
                        💡 <strong>Lưu ý:</strong> Nếu không thấy tùy chọn, hãy
                        thử refresh trang (F5) và làm lại từ đầu.
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>
                    Hủy
                </Button>
                <Button
                    onClick={onRetry}
                    variant="contained"
                    sx={{ textTransform: 'none' }}
                >
                    Thử lại
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PermissionGuideModal;
