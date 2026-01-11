import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import {
    Globe,
    Ruler,
    User,
    Crown,
    Check,
    Loader2,
    Bell,
    Sparkles,
    AlertCircle,
    ChevronLeft,
    Download,
    Trash2,
    Shield,
    GraduationCap,
    Users
} from 'lucide-react';
import { BackButton } from '../components/Navigation';
import NotificationSettings from '../components/NotificationSettings';
import {
    requestNotificationPermission,
    checkNotificationStatus,
    showLocalNotification
} from '../services/notificationService';

export default function Settings() {
    const { user, profile, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    const [settings, setSettings] = useState({
        language: 'es',
        units: 'metric',
        avatarUrl: ''
    });

    const [notifStatus, setNotifStatus] = useState(null);
    const [testComplete, setTestComplete] = useState(false);

    // GDPR state
    const [exportingData, setExportingData] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const API_BASE = import.meta.env.VITE_FUNCTIONS_URL || '';

    // GDPR handlers
    const handleExportData = async () => {
        if (!user) return;
        setExportingData(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_BASE}/exportUserData`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Error al exportar datos');

            const result = await response.json();

            // Download as JSON file
            const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fitai-mis-datos-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export error:', err);
            setError('Error al exportar datos. Intenta de nuevo.');
        } finally {
            setExportingData(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user || deleteConfirmText !== 'ELIMINAR MI CUENTA') return;
        setDeletingAccount(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_BASE}/deleteUserAccount`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ confirmDelete: 'ELIMINAR MI CUENTA' })
            });

            if (!response.ok) throw new Error('Error al eliminar cuenta');

            // Logout and redirect
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Delete error:', err);
            setError('Error al eliminar cuenta. Intenta de nuevo.');
            setDeletingAccount(false);
        }
    };

    // Sync settings with profile/i18n once auth is ready
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate('/login');
            } else {
                setSettings({
                    language: i18n?.language || profile?.language || 'es',
                    units: profile?.units || 'metric',
                    avatarUrl: profile?.avatarUrl || ''
                });
                setLoading(false);
                setNotifStatus(checkNotificationStatus());
            }
        }
    }, [user, authLoading, navigate, profile, i18n?.language]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setError(null);
        try {
            // Update language in i18n
            if (i18n && i18n.language !== settings.language) {
                await i18n.changeLanguage(settings.language);
            }

            // Update profile in Firestore
            await updateDoc(doc(db, 'users', user.uid), {
                units: settings.units,
                language: settings.language,
                avatarUrl: settings.avatarUrl,
                updatedAt: new Date()
            });

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error("Error saving settings:", err);
            setError("No se pudieron guardar los cambios");
        } finally {
            setSaving(false);
        }
    };

    const handleTestNotification = async () => {
        try {
            await showLocalNotification('¡FitAI Funciona!', {
                body: 'Configuración guardada correctamente.',
                badge: '/logo192.png'
            });
            setTestComplete(true);
            setTimeout(() => setTestComplete(false), 3000);
        } catch (error) {
            console.error("Error showing notation:", error);
        }
    };

    const handleRequestPermission = async () => {
        if (!user) return;
        try {
            const token = await requestNotificationPermission(user.uid);
            if (token) {
                setNotifStatus(checkNotificationStatus());
            }
        } catch (error) {
            console.error("Error requesting permission:", error);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-blue-500" size={40} />
                <p className="text-slate-500 text-sm animate-pulse font-medium">Cargando Ajustes...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
                    <BackButton to="/dashboard" />
                    <h1 className="text-xl font-bold font-outfit">{t('settings.title', 'Configuración')}</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 pb-24 space-y-6">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm"
                    >
                        <AlertCircle size={18} />
                        {error}
                    </motion.div>
                )}

                {/* Profile Snapshot Section */}
                <section className="glass rounded-2xl p-6 border border-white/5 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold border-2 border-white/10 shadow-lg overflow-hidden">
                                {profile?.avatarUrl ? (
                                    <img
                                        src={profile.avatarUrl}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                ) : (
                                    user?.displayName ? user.displayName[0].toUpperCase() : <User size={30} />
                                )}
                            </div>
                            {/* Level Badge */}
                            <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-orange-600 text-slate-900 text-[10px] font-black w-6 h-6 rounded-lg flex items-center justify-center border-2 border-slate-950">
                                {profile?.level || Math.floor((profile?.totalXP || 0) / 500) + 1}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg font-bold truncate">{profile?.name || user?.displayName || 'Usuario'}</h2>
                                {profile?.isPremium && (
                                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] px-2 py-0.5 rounded-full text-slate-900 font-black uppercase">ELITE</span>
                                )}
                            </div>
                            <p className="text-slate-400 text-sm truncate">{user?.email}</p>

                            {/* XP Bar */}
                            <div className="mt-2">
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="text-slate-500">Nivel {profile?.level || Math.floor((profile?.totalXP || 0) / 500) + 1}</span>
                                    <span className="text-purple-400 font-bold">{(profile?.totalXP || 0) % 500}/500 XP</span>
                                </div>
                                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((profile?.totalXP || 0) % 500) / 5}%` }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
                        <div className="text-center">
                            <div className="text-lg font-black text-blue-400">{profile?.workoutsCompleted || 0}</div>
                            <div className="text-[9px] text-slate-500 uppercase font-bold">Entrenos</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-black text-orange-400">{profile?.currentStreak || 0}d</div>
                            <div className="text-[9px] text-slate-500 uppercase font-bold">Racha</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-black text-purple-400">{profile?.totalXP || 0}</div>
                            <div className="text-[9px] text-slate-500 uppercase font-bold">XP Total</div>
                        </div>
                    </div>
                </section>

                {/* Avatar URL Section */}
                <section className="glass rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-purple-500/20 p-2 rounded-lg">
                            <User className="text-purple-400" size={20} />
                        </div>
                        <h2 className="font-bold text-lg font-outfit">Foto de Perfil</h2>
                    </div>

                    <div className="space-y-3">
                        <p className="text-slate-400 text-sm">Pega el enlace de tu imagen de perfil (desde cualquier servicio de hosting de imágenes).</p>
                        <input
                            type="url"
                            value={settings.avatarUrl}
                            onChange={(e) => setSettings({ ...settings, avatarUrl: e.target.value })}
                            placeholder="https://ejemplo.com/mi-avatar.jpg"
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-slate-600"
                        />
                        {settings.avatarUrl && (
                            <div className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-xl border border-white/5">
                                <img
                                    src={settings.avatarUrl}
                                    alt="Preview"
                                    className="w-16 h-16 rounded-xl object-cover border border-white/10"
                                    onError={(e) => e.target.src = 'https://via.placeholder.com/64?text=Error'}
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-green-400">Vista previa</p>
                                    <p className="text-[10px] text-slate-500 truncate">{settings.avatarUrl}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Language Section */}
                <section className="glass rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-500/20 p-2 rounded-lg">
                            <Globe className="text-blue-400" size={20} />
                        </div>
                        <h2 className="font-bold text-lg font-outfit">{t('settings.language', 'Idioma')}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { code: 'es', label: 'Español', flag: '🇦🇷' },
                            { code: 'en', label: 'English', flag: '🇺🇸' }
                        ].map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => setSettings({ ...settings, language: lang.code })}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${settings.language === lang.code
                                    ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                    : 'border-slate-800 hover:border-slate-700 hover:bg-white/5'
                                    }`}
                            >
                                <div className="text-2xl mb-1">{lang.flag}</div>
                                <div className="font-bold">{lang.label}</div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Units Section */}
                <section className="glass rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-500/20 p-2 rounded-lg">
                            <Ruler className="text-green-400" size={20} />
                        </div>
                        <h2 className="font-bold text-lg font-outfit">{t('settings.units', 'Sistema de Unidades')}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setSettings({ ...settings, units: 'metric' })}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${settings.units === 'metric'
                                ? 'border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                : 'border-slate-800 hover:border-slate-700 hover:bg-white/5'
                                }`}
                        >
                            <div className="font-bold text-lg text-green-400">kg / cm</div>
                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">{t('settings.metric', 'Métrico')}</div>
                        </button>
                        <button
                            onClick={() => setSettings({ ...settings, units: 'imperial' })}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${settings.units === 'imperial'
                                ? 'border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                : 'border-slate-800 hover:border-slate-700 hover:bg-white/5'
                                }`}
                        >
                            <div className="font-bold text-lg text-green-400">lb / ft</div>
                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">{t('settings.imperial', 'Imperial')}</div>
                        </button>
                    </div>
                </section>

                {/* Notifications Section */}
                <section className="glass rounded-[2rem] p-6 border border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                            <Bell className="text-yellow-400" size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">{t('settings.notifications', 'Notificaciones')}</h3>
                            <p className="text-[10px] text-slate-500">
                                {notifStatus?.permission === 'granted' ? 'Activo' :
                                    notifStatus?.permission === 'denied' ? 'Bloqueado' : 'Pendiente'}
                            </p>
                        </div>

                        {profile?.lastFcmToken && (
                            <div className="ml-auto text-[9px] text-slate-600 font-mono bg-slate-950 p-2 rounded border border-white/5 max-w-[80px] break-all line-clamp-1">
                                {profile.lastFcmToken.substring(0, 8)}...
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Status Alert */}
                        {notifStatus?.permission === 'denied' && (
                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex gap-3 items-start">
                                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                                <div>
                                    <p className="text-xs text-red-200 font-bold mb-1">Permisos bloqueados</p>
                                    <p className="text-[10px] text-red-300/80 leading-relaxed">
                                        Has bloqueado las notificaciones. Para activarlas, ve a la configuración de tu navegador (icono de candado en la barra de direcciones) y permite las notificaciones para este sitio.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Reminder Settings */}
                        <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-slate-300">Recordatorios de entrenamiento</label>
                                <button
                                    onClick={() => setSettings(s => ({
                                        ...s,
                                        notificationPreferences: {
                                            ...s.notificationPreferences,
                                            workoutReminder: !s.notificationPreferences?.workoutReminder
                                        }
                                    }))}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.notificationPreferences?.workoutReminder ? 'bg-green-500' : 'bg-slate-700'
                                        }`}
                                >
                                    <motion.div
                                        className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"
                                        animate={{ x: settings.notificationPreferences?.workoutReminder ? 24 : 0 }}
                                    />
                                </button>
                            </div>

                            {settings.notificationPreferences?.workoutReminder && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    className="pt-2 space-y-4 border-t border-white/5"
                                >
                                    <div>
                                        <label className="text-xs text-slate-400 mb-2 block">Hora preferida (UTC)</label>
                                        <select
                                            value={settings.notificationPreferences?.reminderHourUTC ?? 12}
                                            onChange={(e) => setSettings(s => ({
                                                ...s,
                                                notificationPreferences: {
                                                    ...s.notificationPreferences,
                                                    reminderHourUTC: parseInt(e.target.value)
                                                }
                                            }))}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm"
                                        >
                                            {Array.from({ length: 24 }).map((_, i) => (
                                                <option key={i} value={i}>
                                                    {i.toString().padStart(2, '0')}:00
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            La hora se ajustará automáticamente a tu zona horaria local.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-400 mb-2 block">Días de recordatorio</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => {
                                                const isActive = settings.notificationPreferences?.reminderDays?.includes(day);
                                                return (
                                                    <button
                                                        key={day}
                                                        onClick={() => {
                                                            const currentDays = settings.notificationPreferences?.reminderDays || [];
                                                            const newDays = isActive
                                                                ? currentDays.filter(d => d !== day)
                                                                : [...currentDays, day];

                                                            setSettings(s => ({
                                                                ...s,
                                                                notificationPreferences: {
                                                                    ...s.notificationPreferences,
                                                                    reminderDays: newDays
                                                                }
                                                            }));
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isActive
                                                            ? 'bg-blue-500 text-white border-blue-500'
                                                            : 'bg-slate-950 text-slate-400 border-white/10 hover:bg-slate-800'
                                                            }`}
                                                    >
                                                        {day.substring(0, 3)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleRequestPermission}
                                className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all border border-white/5"
                            >
                                <Bell size={14} /> Re-vincular
                            </button>
                            <button
                                onClick={handleTestNotification}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border border-blue-500/30 ${testComplete ? 'bg-green-500 text-white' : 'bg-blue-600/10 text-blue-400 hover:bg-blue-600/20'
                                    }`}
                            >
                                {testComplete ? <Check size={14} /> : <Sparkles size={14} />}
                                Probar
                            </button>
                        </div>
                    </div>
                </section>

                {/* GDPR / Privacy Section */}
                <section className="glass rounded-[2rem] p-6 border border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                            <Shield className="text-purple-400" size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Privacidad y Datos</h3>
                            <p className="text-[10px] text-slate-500">Cumplimiento GDPR</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                            <h4 className="font-bold text-sm mb-2">Exportar mis datos</h4>
                            <p className="text-[10px] text-slate-500 mb-3">
                                Descarga una copia de todos tus datos en formato JSON.
                            </p>
                            <button
                                onClick={handleExportData}
                                disabled={exportingData}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all border border-white/5 disabled:opacity-50"
                            >
                                {exportingData ? (
                                    <Loader2 className="animate-spin" size={14} />
                                ) : (
                                    <Download size={14} />
                                )}
                                {exportingData ? 'Exportando...' : 'Descargar mis datos'}
                            </button>
                        </div>

                        <div className="bg-red-950/20 rounded-2xl p-4 border border-red-500/20">
                            <h4 className="font-bold text-sm text-red-400 mb-2">Eliminar mi cuenta</h4>
                            <p className="text-[10px] text-slate-500 mb-3">
                                Esta acción es permanente. Se eliminarán todos tus datos.
                            </p>

                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-xl text-xs font-bold transition-all border border-red-500/30"
                                >
                                    <Trash2 size={14} />
                                    Eliminar cuenta permanentemente
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-[10px] text-red-300">
                                        Escribe <strong>ELIMINAR MI CUENTA</strong> para confirmar:
                                    </p>
                                    <input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder="ELIMINAR MI CUENTA"
                                        className="w-full bg-slate-950 border border-red-500/30 rounded-xl p-3 text-sm text-center"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                setShowDeleteConfirm(false);
                                                setDeleteConfirmText('');
                                            }}
                                            className="py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={deleteConfirmText !== 'ELIMINAR MI CUENTA' || deletingAccount}
                                            className="py-2 bg-red-600 hover:bg-red-700 disabled:opacity-30 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                                        >
                                            {deletingAccount ? (
                                                <Loader2 className="animate-spin" size={12} />
                                            ) : (
                                                <Trash2 size={12} />
                                            )}
                                            Confirmar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Trainer/Coach Section */}
                <section className="glass rounded-[2rem] p-6 border border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                            <GraduationCap className="text-cyan-400" size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Modo Entrenador</h3>
                            <p className="text-[10px] text-slate-500">
                                {profile?.role === 'trainer' ? 'Gestioná tus alumnos' : 'Convertite en Coach'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {profile?.role === 'trainer' ? (
                            <button
                                onClick={() => navigate('/trainer')}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold transition-all"
                            >
                                <Users size={18} />
                                Ir a mi Dashboard de Trainer
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-slate-400 text-sm">
                                    ¿Sos entrenador personal o coach? Llevá el control de tus alumnos, asigná rutinas y visualizá su progreso.
                                </p>
                                <button
                                    onClick={() => navigate('/become-trainer')}
                                    className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-xl font-bold text-cyan-400 hover:bg-cyan-600/30 transition-all"
                                >
                                    <GraduationCap size={18} />
                                    Convertirme en Trainer
                                </button>
                            </div>
                        )}

                        {profile?.coachId && (
                            <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5 text-xs text-slate-400">
                                <span className="text-blue-400 font-bold">📋 Tenés un entrenador vinculado.</span>
                                <p className="mt-1">Tu progreso es visible para tu coach.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Save Button Floating or Bottom */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl ${saved
                        ? 'bg-green-500'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20'
                        }`}
                >
                    {saving ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : saved ? (
                        <>
                            <Check size={20} />
                            {t('settings.saved', '¡Guardado con éxito!')}
                        </>
                    ) : (
                        t('common.save', 'Guardar cambios')
                    )}
                </motion.button>

                {/* Logout Button */}
                <button
                    onClick={logout}
                    className="w-full py-3 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.2em] mt-4"
                >
                    Finalizar Sesión
                </button>
            </main>
        </div>
    );
}
