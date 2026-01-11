/**
 * Notification Service
 * 
 * Servicio para manejar notificaciones push con Firebase Cloud Messaging.
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import app from '../config/firebase';

// VAPID key for web push - this needs to be set in .env
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messaging = null;

/**
 * Initialize Firebase Messaging (only in supported browsers)
 */
const initMessaging = () => {
    if (messaging) return messaging;

    try {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.log('[Notifications] Not supported in this browser');
            return null;
        }

        // Check if service workers are supported
        if (!('serviceWorker' in navigator)) {
            console.log('[Notifications] Service workers not supported');
            return null;
        }

        messaging = getMessaging(app);
        return messaging;
    } catch (error) {
        console.error('[Notifications] Error initializing messaging:', error);
        return null;
    }
};

/**
 * Request notification permission and get FCM token
 * @param {string} userId - User ID to associate with the token
 * @returns {Promise<string|null>} FCM token or null if not supported/denied
 */
export const requestNotificationPermission = async (userId) => {
    const msg = initMessaging();
    if (!msg) return null;

    try {
        // Request permission
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            console.log('[Notifications] Permission denied');
            return null;
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('[Notifications] Service worker registered:', registration);

        // Get FCM token
        const token = await getToken(msg, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (token) {
            console.log('[Notifications] FCM token:', token);

            // Save token to Firestore
            await saveTokenToFirestore(userId, token);

            return token;
        } else {
            console.log('[Notifications] No token available');
            return null;
        }
    } catch (error) {
        console.error('[Notifications] Error getting token:', error);
        return null;
    }
};

/**
 * Save FCM token to Firestore
 */
const saveTokenToFirestore = async (userId, token) => {
    if (!userId || !token) return;

    try {
        await setDoc(doc(db, 'users', userId, 'fcmTokens', token), {
            token,
            createdAt: serverTimestamp(),
            platform: 'web',
            userAgent: navigator.userAgent,
            lastActive: serverTimestamp()
        });

        // Also update the main user document with hasNotifications flag
        await setDoc(doc(db, 'users', userId), {
            hasNotifications: true,
            lastFcmToken: token
        }, { merge: true });

        console.log('[Notifications] Token saved to Firestore');
    } catch (error) {
        console.error('[Notifications] Error saving token:', error);
    }
};

/**
 * Listen for foreground messages
 * @param {Function} callback - Callback when message received
 * @returns {Function} Unsubscribe function
 */
export const onForegroundMessage = (callback) => {
    const msg = initMessaging();
    if (!msg) return () => { };

    return onMessage(msg, (payload) => {
        console.log('[Notifications] Foreground message:', payload);
        callback(payload);
    });
};

/**
 * Check if notifications are enabled
 */
export const checkNotificationStatus = () => {
    if (!('Notification' in window)) {
        return { supported: false, permission: 'unsupported' };
    }

    return {
        supported: true,
        permission: Notification.permission
    };
};

/**
 * Show a local notification (for testing or immediate feedback)
 */
export const showLocalNotification = async (title, options = {}) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        console.log('[Notifications] Cannot show local notification');
        return;
    }

    const registration = await navigator.serviceWorker.ready;

    registration.showNotification(title, {
        icon: '/logo192.png',
        badge: '/badge.png',
        vibrate: [100, 50, 100],
        ...options
    });
};
