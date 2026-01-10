/**
 * Utility for playing notification sounds
 */

// Simple notification sound using Web Audio API
export const playNotificationSound = () => {
    try {
        const audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Notification sound: two quick beeps
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.1,
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);

        // Second beep
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';

        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
        gainNode2.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.25,
        );

        oscillator2.start(audioContext.currentTime + 0.15);
        oscillator2.stop(audioContext.currentTime + 0.25);
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
};

// Alternative: use HTML5 Audio with a notification sound file
export const playNotificationSoundFromFile = (
    soundFile = '/notification.mp3',
) => {
    try {
        const audio = new Audio(soundFile);
        audio.volume = 0.5;
        audio.play().catch((err) => {
            console.error('Error playing notification sound:', err);
        });
    } catch (error) {
        console.error('Error creating audio:', error);
    }
};
