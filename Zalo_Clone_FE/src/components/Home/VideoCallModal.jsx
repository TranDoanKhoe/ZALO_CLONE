import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    Box,
    IconButton,
    Typography,
    Avatar,
    styled,
} from '@mui/material';
import {
    BiMicrophone,
    BiMicrophoneOff,
    BiVideo,
    BiVideoOff,
    BiPhoneOff,
} from 'react-icons/bi';

const CallContainer = styled(Box)({
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#1c1c1e',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
});

const VideoContainer = styled(Box)({
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
});

const RemoteVideo = styled('video')({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
});

const LocalVideo = styled('video')({
    position: 'absolute',
    top: 20,
    right: 20,
    width: 200,
    height: 150,
    objectFit: 'cover',
    borderRadius: 8,
    border: '2px solid #fff',
    zIndex: 10,
});

const ControlsContainer = styled(Box)({
    position: 'absolute',
    bottom: 30,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 20,
    zIndex: 10,
});

const ControlButton = styled(IconButton)(({ theme, color }) => ({
    width: 60,
    height: 60,
    backgroundColor: color === 'error' ? '#ff3b30' : '#3a3a3c',
    color: '#fff',
    '&:hover': {
        backgroundColor: color === 'error' ? '#d32f2f' : '#48484a',
    },
}));

const CallerInfo = styled(Box)({
    textAlign: 'center',
    color: '#fff',
    marginBottom: 40,
});

const VideoCallModal = ({
    open,
    onClose,
    contact,
    isVideoCall,
    localStream,
    remoteStream,
    onToggleAudio,
    onToggleVideo,
    isAudioEnabled,
    isVideoEnabled,
    callStatus,
}) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const handleEndCall = () => {
        onClose();
    };

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
                {remoteStream ? (
                    <VideoContainer>
                        {isVideoCall && (
                            <>
                                <RemoteVideo
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                />
                                {localStream && isVideoEnabled && (
                                    <LocalVideo
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                    />
                                )}
                            </>
                        )}
                        {!isVideoCall && (
                            <CallerInfo>
                                <Avatar
                                    src={contact?.avatar}
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        margin: '0 auto 20px',
                                        fontSize: 48,
                                    }}
                                >
                                    {contact?.name?.charAt(0)}
                                </Avatar>
                                <Typography variant="h5" gutterBottom>
                                    {contact?.name}
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{ color: '#8e8e93' }}
                                >
                                    {callStatus || 'Đang kết nối...'}
                                </Typography>
                            </CallerInfo>
                        )}
                    </VideoContainer>
                ) : (
                    <CallerInfo>
                        <Avatar
                            src={contact?.avatar}
                            sx={{
                                width: 120,
                                height: 120,
                                margin: '0 auto 20px',
                                fontSize: 48,
                            }}
                        >
                            {contact?.name?.charAt(0)}
                        </Avatar>
                        <Typography variant="h5" gutterBottom>
                            {contact?.name}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#8e8e93' }}>
                            {callStatus || 'Đang gọi...'}
                        </Typography>
                    </CallerInfo>
                )}

                <ControlsContainer>
                    <ControlButton onClick={onToggleAudio} title="Tắt/Bật mic">
                        {isAudioEnabled ? (
                            <BiMicrophone size={28} />
                        ) : (
                            <BiMicrophoneOff size={28} />
                        )}
                    </ControlButton>

                    {isVideoCall && (
                        <ControlButton
                            onClick={onToggleVideo}
                            title="Tắt/Bật camera"
                        >
                            {isVideoEnabled ? (
                                <BiVideo size={28} />
                            ) : (
                                <BiVideoOff size={28} />
                            )}
                        </ControlButton>
                    )}

                    <ControlButton
                        color="error"
                        onClick={handleEndCall}
                        title="Kết thúc cuộc gọi"
                    >
                        <BiPhoneOff size={28} />
                    </ControlButton>
                </ControlsContainer>
            </CallContainer>
        </Dialog>
    );
};

export default VideoCallModal;
