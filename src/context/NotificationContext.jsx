import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Check, AlertTriangle, Info, Trophy, Dumbbell, ShoppingBag } from 'lucide-react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

const NOTIFICATION_TYPES = {
    success: { icon: Check, color: 'green' },
    error: { icon: AlertTriangle, color: 'red' },
    info: { icon: Info, color: 'blue' },
    achievement: { icon: Trophy, color: 'yellow' },
    workout: { icon: Dumbbell, color: 'purple' },
    shop: { icon: ShoppingBag, color: 'cyan' }
};

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [toasts, setToasts] = useState([]);

    // Add a persistent notification
    const addNotification = useCallback((notification) => {
        const id = Date.now();
        const newNotification = {
            id,
            timestamp: new Date().toISOString(),
            read: false,
            type: 'info',
            ...notification
        };
        setNotifications(prev => [newNotification, ...prev]);
        return id;
    }, []);

    // Mark notification as read
    const markAsRead = useCallback((id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    // Clear a notification
    const clearNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Show a toast (temporary notification)
    const showToast = useCallback((toast) => {
        const id = Date.now();
        const newToast = {
            id,
            type: 'info',
            duration: 4000,
            ...toast
        };
        setToasts(prev => [...prev, newToast]);

        // Auto remove
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, newToast.duration);

        return id;
    }, []);

    // Dismiss toast
    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const value = {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        showToast,
        dismissToast
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </NotificationContext.Provider>
    );
}

// Toast Container (floating notifications)
function ToastContainer({ toasts, onDismiss }) {
    return (
        <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
            <AnimatePresence>
                {toasts.map(toast => (
                    <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function Toast({ toast, onDismiss }) {
    const config = NOTIFICATION_TYPES[toast.type] || NOTIFICATION_TYPES.info;
    const Icon = config.icon;
    const colorClasses = {
        green: 'bg-green-500/10 border-green-500/30 text-green-400',
        red: 'bg-red-500/10 border-red-500/30 text-red-400',
        blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
        purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
        cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className={`pointer-events-auto bg-slate-900/95 backdrop-blur-xl border rounded-2xl p-4 shadow-2xl ${colorClasses[config.color]}`}
        >
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl bg-${config.color}-500/20`}>
                    <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    {toast.title && <div className="font-bold text-white text-sm">{toast.title}</div>}
                    <div className="text-sm text-slate-300">{toast.message}</div>
                </div>
                <button
                    onClick={() => onDismiss(toast.id)}
                    className="text-slate-500 hover:text-white p-1"
                >
                    <X size={16} />
                </button>
            </div>
        </motion.div>
    );
}

// Notification Bell Component
export function NotificationBell({ onClick }) {
    const { unreadCount } = useNotifications();

    return (
        <button
            onClick={onClick}
            className="relative p-2 rounded-xl bg-slate-900 border border-white/5 hover:border-white/20 transition-all"
        >
            <Bell size={20} className="text-slate-400" />
            {unreadCount > 0 && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold"
                >
                    {unreadCount > 9 ? '9+' : unreadCount}
                </motion.div>
            )}
        </button>
    );
}

// Notification Panel (slide-out or modal)
export function NotificationPanel({ isOpen, onClose }) {
    const { notifications, markAsRead, markAllAsRead, clearNotification } = useNotifications();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-slate-950 border-l border-white/5 overflow-y-auto"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-black">Notificaciones</h2>
                            <p className="text-xs text-slate-500">{notifications.length} notificaciones</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {notifications.some(n => !n.read) && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                                >
                                    Marcar leídas
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 rounded-xl bg-slate-900">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="text-center py-12 text-slate-600">
                            <Bell size={48} className="mx-auto mb-4 opacity-30" />
                            <p>No tienes notificaciones</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map(notification => {
                                const config = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.info;
                                const Icon = config.icon;
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => markAsRead(notification.id)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${notification.read
                                                ? 'bg-slate-900/30 border-white/5 opacity-60'
                                                : 'bg-slate-900 border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-xl bg-${config.color}-500/10`}>
                                                <Icon size={16} className={`text-${config.color}-400`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-sm">{notification.title}</div>
                                                <div className="text-xs text-slate-400 mt-1">{notification.message}</div>
                                                <div className="text-[10px] text-slate-600 mt-2">
                                                    {new Date(notification.timestamp).toLocaleString('es')}
                                                </div>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
