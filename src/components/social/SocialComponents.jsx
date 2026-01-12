import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Flame, Dumbbell, Trophy, Heart, MessageCircle,
    Share2, ChevronDown, ChevronUp, Zap, Award, Star, UserPlus, Crown, Plus
} from 'lucide-react';

// Kudos Button with Liquid/Bubbly animation
export const KudosButton = ({ count, hasGiven, onKudos, size = 'normal' }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [localCount, setLocalCount] = useState(count);
    const [localHasGiven, setLocalHasGiven] = useState(hasGiven);

    const handleClick = () => {
        if (localHasGiven) return;

        setIsAnimating(true);
        setLocalCount(prev => prev + 1);
        setLocalHasGiven(true);

        if (navigator.vibrate) navigator.vibrate([10, 30, 10]);

        setTimeout(() => setIsAnimating(false), 800);
        onKudos?.();
    };

    return (
        <motion.button
            onClick={handleClick}
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${localHasGiven
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                : 'bg-white/[0.03] text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 border border-white/5'
                }`}
            whileTap={{ scale: 0.92 }}
        >
            {/* Liquid Bubbles Effect */}
            <AnimatePresence>
                {isAnimating && (
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-full bg-rose-500"
                                initial={{ x: '50%', y: '50%', scale: 0, opacity: 1 }}
                                animate={{
                                    x: `${50 + (Math.random() - 0.5) * 150}%`,
                                    y: `${50 - Math.random() * 200}%`,
                                    scale: [0, 1, 0],
                                    opacity: [1, 0.8, 0]
                                }}
                                transition={{ duration: 0.6 + Math.random() * 0.4, ease: "easeOut" }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <motion.div
                animate={isAnimating ? {
                    scale: [1, 1.4, 0.9, 1.1, 1],
                    rotate: [0, -15, 15, -5, 0]
                } : {}}
                transition={{ duration: 0.6, type: "spring" }}
            >
                <Heart
                    size={18}
                    fill={localHasGiven ? 'currentColor' : 'none'}
                    strokeWidth={localHasGiven ? 0 : 2}
                    className={isAnimating ? "filter drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" : ""}
                />
            </motion.div>
            <span className="font-black text-xs tracking-tight">{localCount}</span>
        </motion.button>
    );
};

// Activity Card for workout posts
export const ActivityCard = ({ activity, onKudos }) => {
    const [expanded, setExpanded] = useState(false);
    const { user, workout, achievement, type, timeAgo } = activity;

    return (
        <motion.div
            className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl hover:border-white/20 transition-all duration-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            layout
        >
            {/* Header */}
            <div className="p-5 flex items-center gap-4 relative z-10">
                <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-indigo-500/20">
                        <div
                            className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-xl overflow-hidden bg-cover bg-center"
                            style={user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : {}}
                        >
                            {!user.avatarUrl && user.avatar}
                        </div>
                    </div>
                    {user.isPremium && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border border-slate-900">
                            <Star size={10} className="text-white" fill="white" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-black text-white text-[15px] tracking-tight truncate">{user.name}</span>
                        <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                            <Zap size={10} className="text-blue-400" />
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Lvl {user.level}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <span>{timeAgo}</span>
                        {user.isLive && (
                            <>
                                <span>•</span>
                                <span className="text-emerald-400 animate-pulse">En Vivo Ahora</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            {type === 'workout' && workout && (
                <div className="px-5 pb-5 relative z-10">
                    {/* Workout Title */}
                    <div className="flex items-center gap-3 mb-4 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <Dumbbell size={20} />
                        </div>
                        <h4 className="font-black text-white text-lg tracking-tight leading-tight">
                            {workout.name}
                        </h4>
                    </div>

                    {/* Stats Grid - Premium Glass Icons */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                            { label: 'Tiempo', value: workout.duration, unit: 'min', icon: Clock, color: 'blue' },
                            { label: 'Calorías', value: workout.calories, unit: 'kcal', icon: Flame, color: 'orange' },
                            { label: 'Sets', value: workout.totalSets, unit: 'series', icon: Zap, color: 'purple' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[24px] p-4 text-center group/stat hover:bg-white/[0.05] transition-all">
                                <div className={`flex items-center justify-center mb-2 text-${stat.color}-400 group-hover/stat:scale-110 transition-transform`}>
                                    <stat.icon size={16} />
                                </div>
                                <div className="text-xl font-black text-white tracking-tighter leading-none mb-1">{stat.value}</div>
                                <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.1em]">{stat.unit}</div>
                            </div>
                        ))}
                    </div>

                    {/* PRs - Elite Shimmer Effect */}
                    {workout.prs && workout.prs.length > 0 && (
                        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                            <div className="flex items-center gap-2 mb-2">
                                <Trophy size={16} className="text-amber-400" />
                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">
                                    {workout.prs.length} {workout.prs.length === 1 ? 'NUEVO RÉCORD' : 'NUEVOS RÉCORDS'}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {workout.prs.map((pr, i) => (
                                    <span key={i} className="text-[11px] font-black bg-slate-900/60 text-white px-3 py-1.5 rounded-xl border border-amber-500/30">
                                        {pr.exercise}: <span className="text-amber-400">{pr.weight}kg</span> × {pr.reps}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Exercises - Clean Expandable */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full flex items-center justify-between text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest px-2 py-1 transition-all"
                    >
                        <span>{workout.exercises.length} Ejercicios Detallados</span>
                        <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
                            <ChevronDown size={14} />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                            >
                                <div className="flex flex-wrap gap-2 pt-4">
                                    {workout.exercises.map((ex, i) => (
                                        <span key={i} className="text-[10px] font-bold bg-white/5 text-slate-300 px-3 py-1.5 rounded-full border border-white/5">
                                            {ex}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Achievement type */}
            {type === 'streak' && achievement && (
                <div className="px-5 pb-5 relative z-10">
                    <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-[32px] p-6 text-center relative overflow-hidden group/streak">
                        <div className="absolute inset-0 bg-orange-500/5 blur-3xl group-hover/streak:scale-150 transition-transform duration-1000" />
                        <div className="text-5xl mb-3 relative z-10">{achievement.icon}</div>
                        <h4 className="font-black text-white text-xl tracking-tight mb-1 relative z-10">{achievement.title}</h4>
                        <p className="text-xs font-bold text-orange-400 uppercase tracking-widest relative z-10">¡{achievement.value} días imparable!</p>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="px-5 py-4 border-t border-white/5 flex items-center gap-8 relative z-10 bg-black/10">
                <KudosButton
                    count={activity.kudos}
                    hasGiven={activity.hasGivenKudos}
                    onKudos={() => onKudos?.(activity.id)}
                />
                <button className="flex items-center gap-2 text-slate-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest">
                    <MessageCircle size={18} />
                    <span>{activity.comments}</span>
                </button>
                <button className="flex items-center justify-center p-2 text-slate-500 hover:text-white transition-all ml-auto">
                    <Share2 size={18} />
                </button>
            </div>
        </motion.div>
    );
};

// Leaderboard Card Redesign - 3D Podium Style
export const LeaderboardCard = ({ data, category, onCategoryChange }) => {
    const categories = [
        { id: 'workouts', label: 'Entrenos', icon: Dumbbell, color: 'blue' },
        { id: 'volume', label: 'Volumen', icon: Zap, color: 'purple' },
        { id: 'streak', label: 'Racha', icon: Flame, color: 'orange' }
    ];

    const formatValue = (value, unit) => {
        if (unit === 'kg' && value > 1000) return `${(value / 1000).toFixed(1)}k`;
        return value.toLocaleString();
    };

    const getTierColor = (catId) => {
        const cat = categories.find(c => c.id === catId);
        return cat ? cat.color : 'blue';
    };

    return (
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[40px] overflow-hidden shadow-2xl relative">
            {/* Mesh Background for Leaderboard */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="p-6 relative z-10 border-b border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
                            <Trophy size={20} className="text-amber-400" />
                            Elite Ranking
                        </h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Élite de la comunidad • Semana 02</p>
                    </div>
                </div>

                {/* Glass Category Tabs */}
                <div className="grid grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => onCategoryChange(cat.id)}
                            className={`flex flex-col items-center gap-1.5 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${category === cat.id
                                ? `bg-${cat.color}-500/10 text-${cat.color}-400 border border-${cat.color}-500/30 shadow-lg shadow-${cat.color}-500/10`
                                : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <cat.icon size={16} />
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Podium Section - 3D Visualization */}
            <div className="p-6 pb-1 relative z-10 flex items-end justify-center gap-1 sm:gap-4 mt-8 h-[240px]">
                {/* 2nd Place */}
                {data[1] && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: '70%' }}
                        className="flex-1 flex flex-col justify-end group cursor-pointer"
                    >
                        <div className="text-center mb-2 group-hover:-translate-y-1 transition-transform">
                            <div
                                className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-400 mx-auto flex items-center justify-center text-3xl shadow-xl shadow-slate-900/40 overflow-hidden bg-cover bg-center"
                                style={data[1].avatarUrl ? { backgroundImage: `url(${data[1].avatarUrl})` } : {}}
                            >
                                {!data[1].avatarUrl && data[1].avatar}
                            </div>
                            <div className="mt-3">
                                <span className="block text-[10px] font-black text-white uppercase tracking-tighter truncate px-1">{data[1].name.split(' ')[0]}</span>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{formatValue(data[1].value, data[1].unit)} {data[1].unit}</span>
                            </div>
                        </div>
                        <div className="bg-gradient-to-t from-slate-900 via-slate-800 to-slate-700/50 rounded-t-3xl border-t border-x border-slate-400/30 shadow-inner h-24 flex items-center justify-center">
                            <span className="text-4xl font-black text-slate-400/20">2</span>
                        </div>
                    </motion.div>
                )}

                {/* 1st Place - The King */}
                {data[0] && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: '90%' }}
                        className="flex-1 flex flex-col justify-end group cursor-pointer relative z-20"
                    >
                        {/* Crown Animation */}
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-20 left-1/2 -translate-x-1/2"
                        >
                            <Crown size={32} className="text-amber-400 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" fill="#fbbf24" />
                        </motion.div>

                        <div className="text-center mb-2 group-hover:-translate-y-2 transition-transform duration-500">
                            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-[2px] shadow-2xl shadow-amber-500/20 mx-auto animate-pulse-subtle">
                                <div
                                    className="w-full h-full rounded-[26px] bg-slate-900 flex items-center justify-center text-5xl border border-white/10 overflow-hidden bg-cover bg-center"
                                    style={data[0].avatarUrl ? { backgroundImage: `url(${data[0].avatarUrl})` } : {}}
                                >
                                    {!data[0].avatarUrl && data[0].avatar}
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className="block text-xs font-black text-white uppercase tracking-tight truncate px-1">{data[0].name.split(' ')[0]}</span>
                                <span className={`text-[13px] font-black text-${getTierColor(category)}-400 uppercase tracking-widest`}>
                                    {formatValue(data[0].value, data[0].unit)} {data[0].unit}
                                </span>
                            </div>
                        </div>
                        <div className="bg-gradient-to-t from-indigo-950 via-indigo-900 to-indigo-800/80 rounded-t-[40px] border-t-2 border-x-2 border-amber-400/50 shadow-[0_-20px_40px_rgba(251,191,36,0.15)] h-36 flex items-center justify-center">
                            <span className="text-6xl font-black text-amber-400/10">1</span>
                        </div>
                    </motion.div>
                )}

                {/* 3rd Place */}
                {data[2] && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: '60%' }}
                        className="flex-1 flex flex-col justify-end group cursor-pointer"
                    >
                        <div className="text-center mb-2 group-hover:-translate-y-1 transition-transform">
                            <div
                                className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-amber-800/60 mx-auto flex items-center justify-center text-3xl shadow-xl shadow-slate-900/40 overflow-hidden bg-cover bg-center"
                                style={data[2].avatarUrl ? { backgroundImage: `url(${data[2].avatarUrl})` } : {}}
                            >
                                {!data[2].avatarUrl && data[2].avatar}
                            </div>
                            <div className="mt-3">
                                <span className="block text-[10px] font-black text-white uppercase tracking-tighter truncate px-1">{data[2].name.split(' ')[0]}</span>
                                <span className="text-xs font-black text-amber-700 uppercase tracking-widest">{formatValue(data[2].value, data[2].unit)} {data[2].unit}</span>
                            </div>
                        </div>
                        <div className="bg-gradient-to-t from-slate-950 via-slate-900 to-slate-800/50 rounded-t-3xl border-t border-x border-amber-800/20 shadow-inner h-20 flex items-center justify-center">
                            <span className="text-3xl font-black text-amber-800/20">3</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Elite List - Glass Row Style */}
            <div className="p-4 space-y-2 relative z-10 bg-black/20 mt-1">
                {data.slice(3).map((user, i) => (
                    <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 bg-white/[0.03] p-3 rounded-2xl border border-white/5 hover:bg-white/[0.06] transition-all hover:translate-x-1 group"
                    >
                        <div className="w-6 text-[10px] font-black text-slate-500 text-center group-hover:text-white transition-colors">#{i + 4}</div>
                        <div
                            className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shadow-lg text-xl overflow-hidden bg-cover bg-center"
                            style={user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : {}}
                        >
                            {!user.avatarUrl && user.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="block text-[13px] font-bold text-white truncate tracking-tight">{user.name}</span>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Atleta activo</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-[14px] font-black text-white tracking-tighter">
                                {formatValue(user.value, user.unit)}
                            </span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{user.unit}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// Live Training Section - Stories Style
export const LiveTrainingSection = ({ liveUsers }) => {
    if (!liveUsers || liveUsers.length === 0) return null;

    return (
        <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-1">
                {liveUsers.map((user, i) => (
                    <motion.div
                        key={user.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer"
                        whileHover={{ y: -2 }}
                    >
                        <div className="relative">
                            {/* Animated Conic Gradient Border */}
                            <div className="absolute -inset-[3px] rounded-[22px] bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 animate-spin-slow opacity-80 group-hover:opacity-100 transition-opacity" />

                            {/* Inner Dark Border */}
                            <div className="absolute inset-0 rounded-[20px] bg-slate-950 z-[1]" />

                            {/* Avatar Container */}
                            <div
                                className="relative z-[2] w-16 h-16 rounded-[18px] overflow-hidden bg-slate-800 flex items-center justify-center text-3xl border border-white/10 shadow-inner bg-cover bg-center"
                                style={user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : {}}
                            >
                                {!user.avatarUrl && user.avatar}

                                {/* Live Indicator Overlay */}
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                            </div>

                            {/* Live Badge */}
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-[3] bg-gradient-to-r from-red-600 to-pink-600 text-[8px] font-black text-white px-2 py-0.5 rounded-full border border-slate-950 shadow-lg tracking-widest uppercase">
                                En Vivo
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-white truncate w-16 text-center tracking-tight">
                                {user.name.split(' ')[0]}
                            </span>
                            {user.currentExercise && (
                                <span className="text-[8px] font-bold text-blue-400 truncate w-16 text-center uppercase tracking-tighter opacity-80">
                                    {user.currentExercise}
                                </span>
                            )}
                        </div>
                    </motion.div>
                ))}

                {/* View All Button */}
                <motion.div
                    className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer"
                    whileHover={{ y: -2 }}
                >
                    <div className="w-16 h-16 rounded-[22px] border-2 border-dashed border-white/10 flex items-center justify-center text-slate-500 group-hover:border-white/30 group-hover:text-white transition-all">
                        <Plus size={24} />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 tracking-tight uppercase">Ver Todos</span>
                </motion.div>
            </div>
        </div>
    );
};

// Workout Buddy Card - Glassmorphism Redesign
export const WorkoutBuddyCard = ({ buddy, onConnect }) => {
    return (
        <motion.div
            className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-6 overflow-hidden transition-all duration-500 hover:border-purple-500/30 shadow-2xl"
            whileHover={{ y: -5 }}
        >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[80px] pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700" />

            <div className="flex items-center gap-4 mb-5 relative z-10">
                <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-[1px] border border-white/10">
                        <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-3xl overflow-hidden shadow-inner">
                            {buddy.user.avatar}
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="font-black text-white text-[15px] tracking-tight truncate mb-0.5">{buddy.user.name}</div>
                    <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full w-fit">
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Nivel {buddy.user.level}</span>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 leading-none">{buddy.compatibility}%</div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Match</div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                {buddy.matchReasons.map((reason, i) => (
                    <span key={i} className="text-[10px] font-bold bg-white/5 text-slate-300 px-3 py-1.5 rounded-xl border border-white/5 group-hover:bg-purple-500/5 group-hover:border-purple-500/10 transition-colors">
                        {reason}
                    </span>
                ))}
            </div>

            <button
                onClick={() => onConnect?.(buddy)}
                className="relative w-full group/btn relative overflow-hidden rounded-2xl p-[1px]"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 animate-gradient-x" />
                <div className="relative bg-slate-950 group-hover/btn:bg-transparent transition-colors py-3 rounded-[15px] flex items-center justify-center gap-2">
                    <UserPlus size={16} className="text-white group-hover/btn:scale-110 transition-transform" />
                    <span className="text-sm font-black text-white uppercase tracking-widest">Conectar</span>
                </div>
            </button>
        </motion.div>
    );
};

export default { KudosButton, ActivityCard, LeaderboardCard, LiveTrainingSection, WorkoutBuddyCard };
