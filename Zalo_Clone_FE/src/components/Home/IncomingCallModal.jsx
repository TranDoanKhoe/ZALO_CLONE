import {
    Dialog,
    Box,
    IconButton,
    Typography,
    Avatar,
    styled,
} from '@mui/material';
import { BiPhoneOff, BiPhoneCall } from 'react-icons/bi';

const CallContainer = styled(Box)({
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#1c1c1e',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
});

const CallerInfo = styled(Box)({
    textAlign: 'center',
    color: '#fff',
    marginBottom: 60,
});

const ButtonsContainer = styled(Box)({
    display: 'flex',
    gap: 40,
});

const ControlButton = styled(IconButton)(({ color }) => ({
    width: 70,
    height: 70,
    backgroundColor: color === 'success' ? '#34c759' : '#ff3b30',
    color: '#fff',
    '&:hover': {
        backgroundColor: color === 'success' ? '#2fb84d' : '#d32f2f',
    },
}));

const RingingText = styled(Typography)({
    color: '#8e8e93',
    fontSize: 18,
    marginTop: 10,
    animation: 'pulse 1.5s ease-in-out infinite',
    '@keyframes pulse': {
        '0%': { opacity: 0.6 },
        '50%': { opacity: 1 },
        '100%': { opacity: 0.6 },
    },
});

const IncomingCallModal = ({
    open,
    caller,
    isVideoCall,
    onAccept,
    onReject,
}) => {
    return (
        <Dialog
            open={open}
            fullScreen
            PaperProps={{
                sx: {
                    backgroundColor: '#1c1c1e',
                },
            }}
        >
            <CallContainer>
                <CallerInfo>
                    <Avatar
                        src={caller?.avatar}
                        sx={{
                            width: 140,
                            height: 140,
                            margin: '0 auto 30px',
                            fontSize: 56,
                            border: '4px solid #fff',
                        }}
                    >
                        {caller?.name?.charAt(0)}
                    </Avatar>
                    <Typography variant="h4" gutterBottom fontWeight={600}>
                        {caller?.name || 'Unknown'}
                    </Typography>
                    <RingingText>
                        {isVideoCall
                            ? 'Cuộc gọi video đến...'
                            : 'Cuộc gọi thoại đến...'}
                    </RingingText>
                </CallerInfo>

                <ButtonsContainer>
                    <ControlButton
                        color="error"
                        onClick={onReject}
                        title="Từ chối"
                    >
                        <BiPhoneOff size={32} />
                    </ControlButton>

                    <ControlButton
                        color="success"
                        onClick={onAccept}
                        title="Chấp nhận"
                    >
                        <BiPhoneCall size={32} />
                    </ControlButton>
                </ButtonsContainer>
            </CallContainer>
        </Dialog>
    );
};

export default IncomingCallModal;
