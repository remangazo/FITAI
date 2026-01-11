/**
 * NotificationSettings Component
 * 
 * Componente para manejar la configuración de notificaciones push.
 * Muestra estado actual y permite activar/desactivar notificaciones.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, BellRing, Check, X, AlertTriangle } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function NotificationSettings() {
    const {
        isSupported,
        isEnabled,
        isDenied,
        permission,
        loading,
        requestPermission
    } = usePushNotifications();

    const [showSuccess, setShowSuccess] = useState(false);

    const handleEnableNotifications = async () => {
        const token = await requestPermission();
        if (token) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    // Not supported in this browser
    if (!isSupported) {
        return (
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
                        <BellOff size={20} className="text-slate-500" />
                    </div>
                    <div>
                        <h4 className="font-medium text-slate-400">Notificaciones</h4>
                        <p className="text-xs text-slate-500">
                            No soportadas en este navegador
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Permission denied - need to change in browser settings
    if (isDenied) {
        return (
            <div className="bg-orange-500/10 rounded-2xl p-4 border border-orange-500/30">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={20} className="text-orange-400" />
                    </div>
                    <div>
                        <h4 className="font-medium text-orange-400">Notificaciones bloqueadas</h4>
                        <p className="text-xs text-slate-400 mt-1">
                            Las notificaciones fueron bloqueadas. Para activarlas, hacé clic en el ícono de candado 🔒 en la barra de direcciones y permitilas manualmente.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Already enabled
    if (isEnabled) {
        return (
            <div className="bg-green-500/10 rounded-2xl p-4 border border-green-500/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <BellRing size={20} className="text-green-400" />
                        </div>
                        <div>
                            <h4 className="font-medium text-green-400">Notificaciones activas</h4>
                            <p className="text-xs text-slate-400">
                                Recibirás recordatorios de entrenamiento y más
                            </p>
                        </div>
                    </div>
                    <Check size={20} className="text-green-400" />
                </div>
            </div>
        );
    }

    // Default - not enabled yet
    return (
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Bell size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <h4 className="font-medium text-white">Notificaciones Push</h4>
                        <p className="text-xs text-slate-400">
                            Recordatorios de entreno, PRs y más
                        </p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEnableNotifications}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        'Activar'
                    )}
                </motion.button>
            </div>

            {/* Success message */}
            {showSuccess && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 bg-green-500/20 text-green-400 text-xs p-2 rounded-lg text-center"
                >
                    ¡Notificaciones activadas! 🔔
                </motion.div>
            )}
        </div>
    );
}
