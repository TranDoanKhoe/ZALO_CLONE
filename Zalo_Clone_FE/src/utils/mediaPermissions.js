/**
 * Check if browser supports WebRTC
 */
export const checkWebRTCSupport = () => {
    return !!(
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia &&
        window.RTCPeerConnection
    );
};

/**
 * Check current permission status for media devices
 */
export const checkMediaPermissions = async (video = false) => {
    if (!navigator.permissions || !navigator.permissions.query) {
        return { microphone: 'prompt', camera: 'prompt' };
    }

    try {
        const micPermission = await navigator.permissions.query({
            name: 'microphone',
        });
        let cameraPermission = { state: 'prompt' };

        if (video) {
            try {
                cameraPermission = await navigator.permissions.query({
                    name: 'camera',
                });
            } catch (e) {
                // Camera permission might not be available
                console.warn('Camera permission query not supported');
            }
        }

        return {
            microphone: micPermission.state,
            camera: cameraPermission.state,
        };
    } catch (error) {
        console.warn('Permission query not supported:', error);
        return { microphone: 'prompt', camera: 'prompt' };
    }
};

/**
 * Request permissions with better UX
 */
export const requestMediaPermissions = async (video = false) => {
    try {
        const constraints = {
            audio: true,
            video: video ? { width: 1280, height: 720 } : false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Stop the tracks immediately as this was just a permission request
        stream.getTracks().forEach((track) => track.stop());

        return { granted: true, error: null };
    } catch (error) {
        let errorMessage = 'Unknown error';

        if (
            error.name === 'NotAllowedError' ||
            error.name === 'PermissionDeniedError'
        ) {
            errorMessage =
                'Bạn đã từ chối quyền truy cập. Vui lòng bật lại trong cài đặt trình duyệt.';
        } else if (
            error.name === 'NotFoundError' ||
            error.name === 'DevicesNotFoundError'
        ) {
            errorMessage =
                'Không tìm thấy microphone/camera. Vui lòng kiểm tra thiết bị.';
        } else if (
            error.name === 'NotReadableError' ||
            error.name === 'TrackStartError'
        ) {
            errorMessage = 'Thiết bị đang được sử dụng bởi ứng dụng khác.';
        } else if (error.name === 'OverconstrainedError') {
            errorMessage =
                'Thiết bị không đáp ứng yêu cầu. Hãy thử lại với cài đặt khác.';
        } else if (error.name === 'SecurityError') {
            errorMessage =
                'Lỗi bảo mật. Vui lòng sử dụng HTTPS hoặc localhost.';
        }

        return { granted: false, error: errorMessage };
    }
};

/**
 * Get user-friendly device names
 */
export const getMediaDevices = async () => {
    try {
        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.enumerateDevices
        ) {
            return { audioInputs: [], videoInputs: [] };
        }

        const devices = await navigator.mediaDevices.enumerateDevices();

        const audioInputs = devices.filter(
            (device) => device.kind === 'audioinput',
        );
        const videoInputs = devices.filter(
            (device) => device.kind === 'videoinput',
        );

        return { audioInputs, videoInputs };
    } catch (error) {
        console.error('Error enumerating devices:', error);
        return { audioInputs: [], videoInputs: [] };
    }
};
