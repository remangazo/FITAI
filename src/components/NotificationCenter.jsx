import React, { useState, useEffect } from 'react';
import { Bell, Heart, UserPlus, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Listen for last 20 notifications
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        });

        return () => unsubscribe();
    }, [user]);

    const markAsRead = async (notification) => {
        if (notification.read) return;
        try {
            await updateDoc(doc(db, 'notifications', notification.id), {
                read: true
            });
        } catch (error) {
            console.error("Error marking read", error);
        }
    };

    const handleNotificationClick = async (notification) => {
        await markAsRead(notification);
        setIsOpen(false);

        // Navigate based on type
        if (notification.type === 'follow') {
            navigate(`/user/${notification.sourceUserId}`);
        } else if (notification.type === 'like' || notification.type === 'comment') {
            // Navigate to post if implemented, else community
            navigate('/community');
        }
    };

    const markAllRead = async () => {
        const batch = writeBatch(db);
        notifications.forEach(n => {
            if (!n.read) {
                batch.update(doc(db, 'notifications', n.id), { read: true });
            }
        });
        await batch.commit();
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                title="Notificaciones"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-slate-950">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-bold text-white">Notificaciones</h3>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300">
                                        Marcar leídas
                                    </button>
                                )}
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleNotificationClick(item)}
                                            className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors flex gap-3 ${!item.read ? 'bg-blue-500/5' : ''}`}
                                        >
                                            <div className="mt-1">
                                                {item.type === 'follow' && <UserPlus size={16} className="text-blue-400" />}
                                                {item.type === 'like' && <Heart size={16} className="text-pink-400" />}
                                                {item.type === 'comment' && <MessageCircle size={16} className="text-green-400" />}
                                                {item.type === 'workout_reminder' && <Bell size={16} className="text-orange-400" />}
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-200 leading-snug">
                                                    <span className="font-bold">{item.sourceName}</span> {item.message?.replace(item.sourceName, '')}
                                                </p>
                                                <span className="text-xs text-slate-500 mt-1 block">
                                                    {item.createdAt?.toMillis ? new Date(item.createdAt.toMillis()).toLocaleDateString() : 'Hace un momento'}
                                                </span>
                                            </div>
                                            {!item.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-500">
                                        <Bell size={24} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No tienes notificaciones</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
