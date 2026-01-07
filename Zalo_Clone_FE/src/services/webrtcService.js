let peerConnection = null;
let localStream = null;
let remoteStream = null;

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export const initializePeerConnection = (onIceCandidate, onTrack) => {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            onIceCandidate(event.candidate);
        }
    };

    peerConnection.ontrack = (event) => {
        remoteStream = event.streams[0];
        onTrack(remoteStream);
    };

    return peerConnection;
};

export const startCall = async (isVideoCall = false) => {
    try {
        const constraints = {
            audio: true,
            video: isVideoCall ? { width: 1280, height: 720 } : false,
        };

        localStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (peerConnection) {
            localStream.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStream);
            });
        }

        return localStream;
    } catch (error) {
        console.error('Error accessing media devices:', error);

        // Provide more specific error messages
        if (error.name === 'NotAllowedError') {
            throw new Error(
                'Bạn cần cho phép quyền truy cập microphone/camera. Vui lòng click vào icon ổ khóa bên cạnh URL và bật quyền.',
            );
        } else if (error.name === 'NotFoundError') {
            throw new Error(
                'Không tìm thấy microphone/camera. Vui lòng kiểm tra thiết bị của bạn.',
            );
        } else if (error.name === 'NotReadableError') {
            throw new Error('Thiết bị đang được sử dụng bởi ứng dụng khác.');
        } else {
            throw new Error(`Không thể truy cập thiết bị: ${error.message}`);
        }
    }
};

export const createOffer = async () => {
    if (!peerConnection) {
        throw new Error('Peer connection not initialized');
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
};

export const createAnswer = async () => {
    if (!peerConnection) {
        throw new Error('Peer connection not initialized');
    }

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
};

export const setRemoteDescription = async (description) => {
    if (!peerConnection) {
        throw new Error('Peer connection not initialized');
    }
    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(description),
    );
};

export const addIceCandidate = async (candidate) => {
    if (!peerConnection) {
        throw new Error('Peer connection not initialized');
    }
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

export const endCall = () => {
    if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
    }

    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    remoteStream = null;
};

export const toggleAudio = () => {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            return audioTrack.enabled;
        }
    }
    return false;
};

export const toggleVideo = () => {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            return videoTrack.enabled;
        }
    }
    return false;
};

export const getLocalStream = () => localStream;
export const getRemoteStream = () => remoteStream;
