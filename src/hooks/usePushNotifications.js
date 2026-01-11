/**
 * usePushNotifications Hook
 * 
 * Hook para manejar notificaciones push en componentes React.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    requestNotificationPermission,
    onForegroundMessage,
    checkNotificationStatus,
    showLocalNotification
} from '../services/notificationService';

export const usePushNotifications = () => {
    const { user } = useAuth();
    const [permission, setPermission] = useState('default');
    const [isSupported, setIsSupported] = useState(true);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lastNotification, setLastNotification] = useState(null);

    // Check initial status
    useEffect(() => {
        const status = checkNotificationStatus();
        setIsSupported(status.supported);
        setPermission(status.permission);

        // Auto-retrieve token if already granted to ensure persistence
        if (status.supported && status.permission === 'granted' && user) {
            requestPermission();
        }
    }, [user]);

    // Listen for foreground messages
    useEffect(() => {
        if (!user || permission !== 'granted') return;

        const unsubscribe = onForegroundMessage((payload) => {
            console.log('[PushNotifications] Foreground message:', payload);
            setLastNotification(payload);

            // Show toast notification for foreground messages
            if (payload.notification) {
                showLocalNotification(
                    payload.notification.title,
                    {
                        body: payload.notification.body,
                        data: payload.data
                    }
                );
            }
        });

        return () => unsubscribe();
    }, [user, permission]);

    /**
     * Request permission and get token
     */
    const requestPermission = useCallback(async () => {
        if (!user) {
            console.log('[PushNotifications] No user logged in');
            return null;
        }

        setLoading(true);
        try {
            const fcmToken = await requestNotificationPermission(user.uid);

            if (fcmToken) {
                setToken(fcmToken);
                setPermission('granted');
                return fcmToken;
            } else {
                if ('Notification' in window) {
                    setPermission(Notification.permission);
                }
                return null;
            }
        } catch (error) {
            console.error('[PushNotifications] Error:', error);
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    /**
     * Check if notifications are enabled
     */
    const isEnabled = permission === 'granted' && token !== null;

    /**
     * Check if permission was denied
     */
    const isDenied = permission === 'denied';

    /**
     * Clear last notification (after it's been shown)
     */
    const clearLastNotification = useCallback(() => {
        setLastNotification(null);
    }, []);

    return {
        // Status
        isSupported,
        isEnabled,
        isDenied,
        permission,
        loading,
        token,

        // Last received notification
        lastNotification,
        clearLastNotification,

        // Actions
        requestPermission
    };
};

export default usePushNotifications;
