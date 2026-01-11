/**
 * Firebase Messaging Service Worker
 * 
 * Este service worker recibe notificaciones push en segundo plano.
 * Debe estar en la raíz del sitio (public folder).
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase configuration
firebase.initializeApp({
    apiKey: "AIzaSyCGxFIeJ7_1nFTUtme66xAVb6Uf11OyYGs",
    authDomain: "msp-fit.firebaseapp.com",
    projectId: "msp-fit",
    storageBucket: "msp-fit.firebasestorage.app",
    messagingSenderId: "858625980092",
    appId: "1:858625980092:web:9eb6122d1178477e0342b9"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const notificationTitle = payload.notification?.title || 'FitAI';
    const notificationOptions = {
        body: payload.notification?.body || 'Tienes una nueva notificación',
        icon: '/logo192.png',
        badge: '/badge.png',
        tag: payload.data?.tag || 'fitai-notification',
        data: payload.data,
        vibrate: [100, 50, 100],
        actions: [
            { action: 'open', title: 'Abrir' },
            { action: 'dismiss', title: 'Cerrar' }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click:', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Navigate to the app
    const urlToOpen = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there's already an open window
                for (const client of windowClients) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        client.navigate(urlToOpen);
                        return;
                    }
                }
                // Open new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('[SW] Push subscription change:', event);
    // Re-subscribe logic would go here
});

// PWA Requirements: Install, Activate and Fetch
self.addEventListener('install', (event) => {
    console.log('[SW] Instalado ✨');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activado 🚀');
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Si la petición es a una API o a Google Cloud Functions, no devolvemos "Offline"
    // para permitir que el frontend maneje los errores reales (404, 500, etc.)
    if (event.request.url.includes('cloudfunctions.net') || event.request.url.includes('/api/')) {
        return; // Deja que la petición siga su curso normal
    }

    event.respondWith(
        fetch(event.request).catch(() => {
            // Solo para archivos estáticos/navegación devolvemos el fallback
            return new Response("Offline", {
                headers: { "Content-Type": "text/plain" }
            });
        })
    );
});
