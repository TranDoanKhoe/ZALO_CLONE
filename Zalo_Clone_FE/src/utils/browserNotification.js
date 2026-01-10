/**
 * Browser notification utilities for desktop notifications
 */

/**
 * Request notification permission from user
 * @returns {Promise<string>} Permission status
 */
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification');
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission;
    }

    return Notification.permission;
};

/**
 * Show a browser notification
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 * @param {string} options.body - Notification body text
 * @param {string} options.icon - Icon URL
 * @param {string} options.tag - Unique tag for notification
 * @param {Function} options.onClick - Click handler
 */
export const showBrowserNotification = (title, options = {}) => {
    if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification');
        return null;
    }

    if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
    }

    try {
        const notification = new Notification(title, {
            body: options.body || '',
            icon: options.icon || '/zalo-icon.png',
            tag: options.tag || 'zalo-notification',
            requireInteraction: false,
            silent: false,
        });

        if (options.onClick) {
            notification.onclick = options.onClick;
        }

        // Auto close after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);

        return notification;
    } catch (error) {
        console.error('Error showing notification:', error);
        return null;
    }
};

/**
 * Check if document is visible (tab is active)
 * @returns {boolean}
 */
export const isDocumentVisible = () => {
    return !document.hidden && document.visibilityState === 'visible';
};

/**
 * Show notification only when tab is not active
 * @param {string} title
 * @param {Object} options
 */
export const showNotificationIfHidden = (title, options = {}) => {
    if (!isDocumentVisible()) {
        return showBrowserNotification(title, options);
    }
    return null;
};
