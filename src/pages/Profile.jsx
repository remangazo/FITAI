import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    User, Settings, Edit2, Camera, ChevronRight, Trophy, Dumbbell,
    Target, Scale, Calendar, Clock, TrendingUp, Award, LogOut, Save,
    Flame, Heart, Moon, Brain, Zap, Ruler, Activity, Utensils, Droplets,
    Star, Medal, Crown, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BottomNav, BackButton } from '../components/Navigation';
import { useNotifications } from '../context/NotificationContext';
import { calculate1RM } from '../services/progressService';
import { getWorkoutHistory, getAllPersonalRecords } from '../services/workoutService';
import { xpService } from '../services/xpService';

export default function Profile() {
    const navigate = useNavigate();
    const { user, profile, logout, updateProfile } = useAuth();
    const { showToast } = useNotifications?.() || { showToast: () => { } };
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [workoutHistory, setWorkoutHistory] = useState([]);
    const [personalRecords, setPersonalRecords] = useState({});
    const [loadingStats, setLoadingStats] = useState(true);

    const [editData, setEditData] = useState({
        name: profile?.name || user?.displayName || 'Usuario',
        weight: profile?.weight || (profile?.weightHistory?.length > 0 ? profile.weightHistory[profile.weightHistory.length - 1].weight : ''),
        height: profile?.height || profile?.metabolicCache?.profile?.height || '',
        targetWeight: profile?.targetWeight || profile?.metabolicCache?.profile?.targetWeight || '',
        experienceYears: profile?.experienceYears || '',
        birthYear: profile?.birthYear || profile?.metabolicCache?.profile?.birthYear || '',
        gender: profile?.gender || profile?.metabolicCache?.profile?.gender || '',
        avatarUrl: profile?.avatarUrl || '',
    });

    useEffect(() => {
        if (profile) {
            setEditData({
                name: profile.name || user?.displayName || 'Usuario',
                weight: profile.weight || (profile?.weightHistory?.length > 0 ? profile.weightHistory[profile.weightHistory.length - 1].weight : ''),
                height: profile.height || profile?.metabolicCache?.profile?.height || '',
                targetWeight: profile.targetWeight || profile?.metabolicCache?.profile?.targetWeight || '',
                experienceYears: profile.experienceYears || '',
                birthYear: profile.birthYear || profile?.metabolicCache?.profile?.birthYear || '',
                gender: profile.gender || profile?.metabolicCache?.profile?.gender || '',
                avatarUrl: profile.avatarUrl || '',
            });
        }
    }, [profile, user]);

    useEffect(() => {
        // Load data for stats
        const loadAllData = async () => {
            if (user?.uid) {
                setLoadingStats(true);
                try {
                    const [history, prs] = await Promise.all([
                        getWorkoutHistory(user.uid, 50),
                        getAllPersonalRecords(user.uid)
                    ]);
                    setWorkoutHistory(history);
                    setPersonalRecords(prs);
                } catch (err) {
                    console.error('[Profile] Error loading data:', err);
                } finally {
                    setLoadingStats(false);
                }
            }
        };
        loadAllData();
    }, [user]);

    // Calculate real stats from workoutHistory and profile
    const totalMinutes = workoutHistory.reduce((sum, w) => sum + (w.duration || 0), 0);
    const totalVolume = workoutHistory.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

    // Calculate weekly completed from workouts in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const workoutsThisWeek = workoutHistory.filter(w => {
        const workoutDate = w.completedAt?.toDate?.() || new Date(w.completedAt || w.startedAt);
        return workoutDate >= oneWeekAgo;
    }).length;

    // Calculate best streak from profile or estimate from data
    const bestStreak = profile?.bestStreak || Math.max(profile?.currentStreak || 0, workoutsThisWeek);

    const stats = {
        workoutsCompleted: workoutHistory.length,
        currentStreak: profile?.currentStreak || 0,
        bestStreak: bestStreak,
        totalXP: profile?.totalXP || 0,
        level: profile?.level || 1,
        prs: Object.keys(personalRecords).length || 0,
        hoursTraining: Math.round(totalMinutes / 60),
        weeklyGoal: profile?.trainingFrequency ? parseInt(profile.trainingFrequency) : 4,
        weeklyCompleted: profile?.weeklyCompleted || workoutsThisWeek,
        caloriesBurned: profile?.totalCaloriesBurned || (workoutHistory.length * 350),
        avgSessionDuration: workoutHistory.length > 0 ? Math.round(totalMinutes / workoutHistory.length) : 0,
    };

    // Calculate BMI and metrics with aggressive fallbacks
    const effectiveBirthYear = profile?.birthYear || profile?.metabolicCache?.profile?.birthYear;
    const effectiveWeight = profile?.weight || (profile?.weightHistory?.length > 0 ? profile.weightHistory[profile.weightHistory.length - 1].weight : null) || profile?.metabolicCache?.profile?.weight;
    const effectiveHeight = profile?.height || profile?.metabolicCache?.profile?.height;
    const bmi = effectiveWeight && effectiveHeight
        ? (parseFloat(effectiveWeight) / Math.pow(parseFloat(effectiveHeight) / 100, 2)).toFixed(1)
        : null;
    const age = effectiveBirthYear ? new Date().getFullYear() - parseInt(effectiveBirthYear) : null;

    // Level progress calculation using xpService
    const {
        level: displayLevel,
        xpInCurrentLevel,
        nextLevelXP,
        progressPercentage: levelProgress
    } = xpService.calculateLevelProgress(stats.totalXP);

    // Achievements (Simplified logic for now, could be service-driven)
    const achievements = [
        { id: 1, name: 'Primera Rutina', icon: '🎯', unlocked: stats.workoutsCompleted >= 1, date: null },
        { id: 2, name: '7 Días Seguidos', icon: '🔥', unlocked: stats.currentStreak >= 7, date: null },
        { id: 3, name: 'Club de Fuerza', icon: '🏋️', unlocked: stats.prs > 0, date: null },
        { id: 4, name: 'Héroe Local', icon: '💪', unlocked: stats.workoutsCompleted >= 10, date: null },
        { id: 5, name: 'Veterano', icon: '📅', unlocked: stats.workoutsCompleted >= 50, date: null },
        { id: 6, name: 'Máquina Imparable', icon: '⚡', unlocked: stats.currentStreak >= 14, date: null },
    ];

    const handleSave = async () => {
        try {
            await updateProfile(editData);
            showToast({ type: 'success', title: 'Guardado', message: 'Perfil actualizado correctamente' });
            setIsEditing(false);
        } catch (error) {
            showToast({ type: 'error', title: 'Error', message: 'No se pudo guardar' });
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24 md:pb-8">
            {/* Header with Avatar */}
            <div className="relative">
                {/* Banner with gradient */}
                <div className="h-40 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-20" />
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-950 to-transparent" />
                </div>

                {/* Back Button */}
                <div className="absolute top-4 left-4">
                    <BackButton to="/dashboard" />
                </div>

                {/* Settings Button */}
                <button
                    onClick={() => navigate('/settings')}
                    className="absolute top-4 right-4 p-2 bg-slate-900/50 rounded-xl backdrop-blur-xl"
                >
                    <Settings size={20} />
                </button>

                {/* Avatar and Info */}
                <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-5xl font-black border-4 border-slate-950 shadow-2xl overflow-hidden">
                                {profile?.avatarUrl ? (
                                    <img
                                        src={profile.avatarUrl}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                ) : (
                                    (profile?.name || user?.displayName || 'U').charAt(0).toUpperCase()
                                )}
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-xl shadow-lg hover:bg-blue-500 transition-colors">
                                <Camera size={16} />
                            </button>
                            {/* Level Badge */}
                            <div className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-400 to-orange-600 text-slate-900 text-xs font-black w-8 h-8 rounded-xl flex items-center justify-center border-2 border-slate-950">
                                {displayLevel}
                            </div>
                        </div>
                        <div className="text-center sm:text-left flex-1 pb-2">
                            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                                <h1 className="text-2xl font-black">{profile?.name || user?.displayName || 'Usuario'}</h1>
                                {profile?.isPremium && (
                                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] px-2 py-0.5 rounded-full text-slate-900 font-black uppercase">
                                        PRO
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-400 text-sm">{user?.email}</p>

                            {/* XP Bar */}
                            <div className="mt-3 max-w-xs mx-auto sm:mx-0">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-500">Nivel {displayLevel}</span>
                                    <span className="text-purple-400 font-bold">{xpInCurrentLevel}/{nextLevelXP} XP</span>
                                </div>
                                <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${levelProgress}%` }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="bg-slate-900 border border-white/10 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:border-white/20 transition-all"
                        >
                            <Edit2 size={14} /> {isEditing ? 'Cancelar' : 'Editar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-4xl mx-auto px-4 mt-6">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {[
                        { id: 'overview', label: 'Resumen', icon: <BarChart3 size={14} /> },
                        { id: 'stats', label: 'Estadísticas', icon: <Activity size={14} /> },
                        { id: 'achievements', label: 'Logros', icon: <Trophy size={14} /> },
                        { id: 'body', label: 'Cuerpo', icon: <User size={14} /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-900 text-slate-400 border border-white/5'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                <AnimatePresence mode="wait">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Main Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <StatCard icon={<Dumbbell size={18} />} label="Entrenos" value={stats.workoutsCompleted} color="blue" />
                                <StatCard icon={<Flame size={18} />} label="Racha" value={`${stats.currentStreak}d`} color="orange" />
                                <StatCard icon={<Award size={18} />} label="PRs" value={stats.prs} color="yellow" />
                                <StatCard icon={<Clock size={18} />} label="Horas" value={`${stats.hoursTraining}h`} color="purple" />
                            </div>

                            {/* Weekly Progress */}
                            <div className="glass p-6 rounded-3xl border border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Calendar size={18} className="text-green-400" /> Esta Semana
                                    </h3>
                                    <span className="text-green-400 font-bold">{stats.weeklyCompleted}/{stats.weeklyGoal} días</span>
                                </div>
                                <div className="flex gap-2">
                                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                                        <div
                                            key={day}
                                            className={`flex-1 aspect-square rounded-xl flex items-center justify-center text-sm font-bold ${i < stats.weeklyCompleted
                                                ? 'bg-green-500 text-white'
                                                : i < stats.weeklyGoal
                                                    ? 'bg-slate-800 text-slate-500 border-2 border-dashed border-slate-700'
                                                    : 'bg-slate-900 text-slate-700'
                                                }`}
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Goals Section */}
                            <div className="glass p-6 rounded-3xl border border-white/5">
                                <h3 className="font-bold flex items-center gap-2 mb-4">
                                    <Target size={18} className="text-purple-400" /> Mis Objetivos
                                </h3>
                                <div className="space-y-4">
                                    <GoalProgress
                                        label={profile?.primaryGoal === 'muscle' ? 'Ganar Músculo' : profile?.primaryGoal === 'fat' ? 'Perder Grasa' : 'Mejorar Fuerza'}
                                        progress={stats.workoutsCompleted > 0 ? Math.min(100, (stats.workoutsCompleted / 12) * 100) : 0}
                                        color="blue"
                                        subtext={stats.workoutsCompleted === 0 ? "Empieza tu primer entreno" : `${stats.workoutsCompleted}/12 entrenos este mes`}
                                    />
                                    <GoalProgress
                                        label="Peso Objetivo"
                                        progress={effectiveWeight && profile?.targetWeight
                                            ? Math.max(0, Math.min(100, (1 - Math.abs(parseFloat(effectiveWeight) - parseFloat(profile.targetWeight)) / 10) * 100))
                                            : profile?.targetWeight ? 50 : 0
                                        }
                                        color="green"
                                        subtext={profile?.targetWeight ? `${effectiveWeight || '?'} → ${profile.targetWeight} kg` : "Establece un objetivo de peso"}
                                    />
                                    <GoalProgress label="Consistencia Semanal" progress={(stats.weeklyCompleted / stats.weeklyGoal) * 100} color="purple" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Stats Tab */}
                    {activeTab === 'stats' && (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Detailed Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <DetailedStatCard icon={<Flame size={20} />} label="Calorías Quemadas" value={stats.caloriesBurned.toLocaleString()} unit="kcal" color="orange" />
                                <DetailedStatCard icon={<Clock size={20} />} label="Duración Promedio" value={stats.avgSessionDuration} unit="min" color="blue" />
                                <DetailedStatCard icon={<Zap size={20} />} label="XP Total" value={stats.totalXP.toLocaleString()} unit="xp" color="purple" />
                                <DetailedStatCard icon={<TrendingUp size={20} />} label="Mejor Racha" value={stats.bestStreak} unit="días" color="green" />
                            </div>

                            {/* Training Distribution */}
                            <div className="glass p-6 rounded-3xl border border-white/5">
                                <h3 className="font-bold mb-4">Distribución de Entrenamiento</h3>
                                <div className="space-y-3">
                                    {[
                                        { muscle: 'Principal', sessions: stats.workoutsCompleted, color: 'indigo' },
                                        { muscle: 'Consistencia', sessions: stats.weeklyCompleted, color: 'emerald' },
                                    ].map(item => (
                                        <div key={item.muscle} className="flex items-center gap-3">
                                            <span className="text-sm text-slate-400 w-20">{item.muscle}</span>
                                            <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(item.sessions / 15) * 100}%` }}
                                                    className={`h-full rounded-full bg-${item.color}-500`}
                                                />
                                            </div>
                                            <span className="text-xs font-bold w-8">{item.sessions}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent PRs */}
                            <div className="glass p-6 rounded-3xl border border-white/5">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <Medal size={18} className="text-yellow-400" /> Récords Personales Recientes
                                </h3>
                                <div className="space-y-3">
                                    {Object.entries(personalRecords).length > 0 ? (
                                        Object.entries(personalRecords).slice(0, 3).map(([exerciseId, record], i) => (
                                            <div key={i} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-xl">
                                                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                                                    <Trophy size={18} className="text-yellow-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-sm capitalize">{exerciseId.replace(/_/g, ' ')}</div>
                                                    <div className="text-xs text-slate-500">Récord Actual</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-black text-lg">{record.weight}kg</div>
                                                    <div className="text-xs text-green-400">{record.reps} reps</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-slate-500 text-sm">
                                            Aún no tienes récords registrados.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Achievements Tab */}
                    {activeTab === 'achievements' && (
                        <motion.div
                            key="achievements"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Achievement Summary */}
                            <div className="glass p-6 rounded-3xl border border-white/5 text-center">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mb-4">
                                    <Trophy size={40} className="text-slate-900" />
                                </div>
                                <div className="text-3xl font-black">{achievements.filter(a => a.unlocked).length}/{achievements.length}</div>
                                <div className="text-slate-400 text-sm">Logros Desbloqueados</div>
                            </div>

                            {/* Achievements Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {achievements.map(achievement => (
                                    <div
                                        key={achievement.id}
                                        className={`glass p-4 rounded-2xl border text-center transition-all ${achievement.unlocked
                                            ? 'border-yellow-500/30 bg-yellow-500/5'
                                            : 'border-white/5 opacity-50 grayscale'
                                            }`}
                                    >
                                        <span className="text-4xl block mb-2">{achievement.icon}</span>
                                        <div className="font-bold text-sm">{achievement.name}</div>
                                        {achievement.unlocked && achievement.date && (
                                            <div className="text-[10px] text-slate-500 mt-1">{achievement.date}</div>
                                        )}
                                        {!achievement.unlocked && (
                                            <div className="text-[10px] text-slate-600 mt-1">🔒 Bloqueado</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Body Tab - Profile Details */}
                    {activeTab === 'body' && (
                        <motion.div
                            key="body"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Body Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <MetricCard icon={<Scale size={18} />} label="Peso" value={effectiveWeight || '—'} unit="kg" />
                                <MetricCard icon={<Ruler size={18} />} label="Altura" value={effectiveHeight || '—'} unit="cm" />
                                <MetricCard icon={<Activity size={18} />} label="IMC" value={bmi || '—'} unit="" highlight={bmi && (bmi < 18.5 || bmi > 25)} />
                                <MetricCard icon={<Calendar size={18} />} label="Edad" value={age || '—'} unit="años" />
                            </div>

                            {/* Profile Details */}
                            <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <h2 className="font-bold flex items-center gap-2">
                                        <User size={18} className="text-blue-400" /> Datos Personales
                                    </h2>
                                    {isEditing && (
                                        <button
                                            onClick={handleSave}
                                            className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                                        >
                                            <Save size={14} /> Guardar
                                        </button>
                                    )}
                                </div>
                                <div className="p-6 space-y-4">
                                    <ProfileField
                                        icon={<User size={16} />}
                                        label="Nombre"
                                        value={editData.name}
                                        isEditing={isEditing}
                                        onChange={(v) => setEditData(prev => ({ ...prev, name: v }))}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <ProfileField
                                            icon={<Scale size={16} />}
                                            label="Peso Actual"
                                            value={editData.weight}
                                            suffix={profile?.units === 'imperial' ? 'lb' : 'kg'}
                                            isEditing={isEditing}
                                            type="number"
                                            onChange={(v) => setEditData(prev => ({ ...prev, weight: v }))}
                                        />
                                        <ProfileField
                                            icon={<Target size={16} />}
                                            label="Peso Objetivo"
                                            value={editData.targetWeight}
                                            suffix={profile?.units === 'imperial' ? 'lb' : 'kg'}
                                            isEditing={isEditing}
                                            type="number"
                                            onChange={(v) => setEditData(prev => ({ ...prev, targetWeight: v }))}
                                        />
                                    </div>
                                    <ProfileField
                                        icon={<Ruler size={16} />}
                                        label="Altura"
                                        value={editData.height}
                                        suffix={profile?.units === 'imperial' ? 'ft' : 'cm'}
                                        isEditing={isEditing}
                                        type="number"
                                        onChange={(v) => setEditData(prev => ({ ...prev, height: v }))}
                                    />
                                    <ProfileField
                                        icon={<Dumbbell size={16} />}
                                        label="Experiencia"
                                        value={editData.experienceYears}
                                        isEditing={isEditing}
                                        onChange={(v) => setEditData(prev => ({ ...prev, experienceYears: v }))}
                                    />
                                    <ProfileField
                                        icon={<Camera size={16} />}
                                        label="URL Imagen de Perfil"
                                        value={editData.avatarUrl}
                                        isEditing={isEditing}
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                        onChange={(v) => setEditData(prev => ({ ...prev, avatarUrl: v }))}
                                    />
                                </div>
                            </div>

                            {/* Training Info */}
                            <div className="glass p-6 rounded-3xl border border-white/5">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <Dumbbell size={18} className="text-orange-400" /> Preferencias de Entrenamiento
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="bg-slate-900/50 p-4 rounded-xl">
                                        <div className="text-slate-500 text-xs uppercase mb-1">Objetivo</div>
                                        <div className="font-bold capitalize">{profile?.primaryGoal || 'Ganar músculo'}</div>
                                    </div>
                                    <div className="bg-slate-900/50 p-4 rounded-xl">
                                        <div className="text-slate-500 text-xs uppercase mb-1">Estilo</div>
                                        <div className="font-bold">{profile?.preferredStyle || 'Híbrido'}</div>
                                    </div>
                                    <div className="bg-slate-900/50 p-4 rounded-xl">
                                        <div className="text-slate-500 text-xs uppercase mb-1">Frecuencia</div>
                                        <div className="font-bold">{profile?.trainingFrequency || '4-5 días'}</div>
                                    </div>
                                    <div className="bg-slate-900/50 p-4 rounded-xl">
                                        <div className="text-slate-500 text-xs uppercase mb-1">Lugar</div>
                                        <div className="font-bold capitalize">{profile?.trainingLocation || 'Gimnasio'}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Quick Links - Always visible */}
                <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                    <QuickLink icon={<Calendar size={18} />} label="Historial de Entrenamientos" onClick={() => navigate('/routines')} />
                    <QuickLink icon={<Utensils size={18} />} label="Plan Nutricional" onClick={() => navigate('/nutrition')} />
                    <QuickLink icon={<Settings size={18} />} label="Configuración" onClick={() => navigate('/settings')} />
                    <QuickLink
                        icon={<LogOut size={18} />}
                        label="Cerrar Sesión"
                        danger
                        onClick={handleLogout}
                    />
                </div>
            </div>

            <BottomNav />
        </div>
    );
}

// Helper Components
function StatCard({ icon, label, value, color }) {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-400',
        green: 'bg-green-500/10 text-green-400',
        yellow: 'bg-yellow-500/10 text-yellow-400',
        purple: 'bg-purple-500/10 text-purple-400',
        orange: 'bg-orange-500/10 text-orange-400',
        cyan: 'bg-cyan-500/10 text-cyan-400',
    };

    return (
        <div className="glass p-4 rounded-2xl border border-white/5 text-center">
            <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${colorClasses[color]}`}>
                {icon}
            </div>
            <div className="text-2xl font-black">{value}</div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">{label}</div>
        </div>
    );
}

function DetailedStatCard({ icon, label, value, unit, color }) {
    const colorClasses = {
        blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
        green: 'from-green-500/20 to-green-500/5 border-green-500/20',
        yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20',
        purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20',
        orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/20',
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} p-4 rounded-2xl border`}>
            <div className="flex items-center gap-2 mb-2 text-slate-400">
                {icon}
                <span className="text-xs font-bold uppercase">{label}</span>
            </div>
            <div className="text-2xl font-black">
                {value} <span className="text-sm text-slate-500">{unit}</span>
            </div>
        </div>
    );
}

function MetricCard({ icon, label, value, unit, highlight }) {
    return (
        <div className={`glass p-4 rounded-2xl border text-center ${highlight ? 'border-orange-500/30' : 'border-white/5'}`}>
            <div className="text-slate-500 mb-2">{icon}</div>
            <div className={`text-2xl font-black ${highlight ? 'text-orange-400' : ''}`}>{value}</div>
            <div className="text-xs text-slate-500">{unit}</div>
            <div className="text-[10px] text-slate-600 uppercase font-bold mt-1">{label}</div>
        </div>
    );
}

function GoalProgress({ label, progress, color, subtext }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-slate-400">{label}</span>
                <span className="font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, progress)}%` }}
                    className={`h-full rounded-full bg-${color}-500`}
                />
            </div>
            {subtext && <div className="text-xs text-slate-500">{subtext}</div>}
        </div>
    );
}

function ProfileField({ icon, label, value, suffix, isEditing, onChange, type = 'text' }) {
    return (
        <div className="flex items-center gap-4">
            <div className="text-slate-500">{icon}</div>
            <div className="flex-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">{label}</label>
                {isEditing ? (
                    <input
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                ) : (
                    <div className="font-bold">
                        {value || '—'} {suffix && value && <span className="text-slate-500 text-sm">{suffix}</span>}
                    </div>
                )}
            </div>
        </div>
    );
}

function QuickLink({ icon, label, value, badge, danger, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full p-4 flex items-center gap-4 border-b border-white/5 last:border-0 hover:bg-slate-900/50 transition-colors ${danger ? 'text-red-400' : ''
                }`}
        >
            <div className={danger ? 'text-red-400' : 'text-slate-500'}>{icon}</div>
            <span className="flex-1 text-left font-medium text-sm">{label}</span>
            {value && <span className="text-slate-500 text-sm">{value}</span>}
            {badge && (
                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold">
                    {badge}
                </span>
            )}
            <ChevronRight size={16} className="text-slate-600" />
        </button>
    );
}
