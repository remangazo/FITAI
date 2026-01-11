// Progress Page - Workout history and progress visualization
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    TrendingUp, Calendar, Dumbbell, Trophy, Clock,
    ChevronRight, ChevronDown, ChevronUp, Flame,
    Target, Activity, ChevronLeft, Scale, CalendarDays
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { BottomNav, BackButton, PageHeader } from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import {
    getWorkoutHistory,
    getWeeklyStats,
    getAllPersonalRecords,
    getExerciseProgress
} from '../services/workoutService';
import WorkoutCalendar from '../components/WorkoutCalendar';

export default function Progress() {
    const { t } = useTranslation();
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [weeklyStats, setWeeklyStats] = useState(null);
    const [workoutHistory, setWorkoutHistory] = useState([]);
    const [personalRecords, setPersonalRecords] = useState({});
    const [expandedWorkout, setExpandedWorkout] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [exerciseProgress, setExerciseProgress] = useState([]);

    useEffect(() => {
        if (user) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [stats, history, prs] = await Promise.all([
                getWeeklyStats(user.uid),
                getWorkoutHistory(user.uid, 20),
                getAllPersonalRecords(user.uid)
            ]);

            setWeeklyStats(stats);
            setWorkoutHistory(history);
            setPersonalRecords(prs);
        } catch (error) {
            console.error('[Progress] Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadExerciseProgress = async (exerciseName) => {
        if (!user) return;
        try {
            const progress = await getExerciseProgress(user.uid, exerciseName);
            setExerciseProgress(progress);
            setSelectedExercise(exerciseName);
        } catch (error) {
            console.error('[Progress] Error loading exercise progress:', error);
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin w-12 h-12 text-blue-500 mx-auto mb-6" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando evolución...</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', icon: Activity, label: 'Resumen' },
        { id: 'history', icon: Calendar, label: 'Historial' },
        { id: 'records', icon: Trophy, label: 'Récords' },
        { id: 'weight', icon: Scale, label: 'Peso' },
        { id: 'calendar', icon: CalendarDays, label: 'Calendario' }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-32">
            <div className="max-w-7xl mx-auto px-4 pt-8">
                <PageHeader
                    title="Evolución"
                    subtitle="Analiza tu progreso y supera tus límites"
                    backTo="/dashboard"
                    showBack={true}
                />

                {/* Modern Tabs */}
                <div className="flex bg-slate-900/50 p-1.5 rounded-[24px] border border-white/5 mb-10 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            <main className="max-w-7xl mx-auto px-4 mt-8">
                <AnimatePresence mode="wait">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-8"
                        >
                            {/* Weekly Stats Header */}
                            <section className="relative overflow-hidden rounded-[40px] border border-white/5 bg-slate-950 p-8 md:p-12">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[120px] pointer-events-none" />
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                            <Flame className="text-orange-400" size={18} /> Resumen Semanal
                                        </h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-white tracking-tighter">{weeklyStats?.workoutsThisWeek || 0}</span>
                                            <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">Entrenamientos</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 flex-1 max-w-md">
                                        <StatCard
                                            icon={<Target className="text-purple-400" size={18} />}
                                            value={`${((weeklyStats?.totalVolume || 0) / 1000).toFixed(1)}k`}
                                            label="Volumen (kg)"
                                            color="purple"
                                        />
                                        <StatCard
                                            icon={<Clock className="text-green-400" size={18} />}
                                            value={weeklyStats?.avgDuration || 0}
                                            label="Mins / Sesión"
                                            color="emerald"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Recent Workouts Grid */}
                            {workoutHistory.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                            <Calendar className="text-emerald-400" size={18} /> Registros Recientes
                                        </h3>
                                        <button
                                            onClick={() => setActiveTab('history')}
                                            className="text-[10px] font-black text-emerald-400 hover:text-white transition-colors tracking-widest uppercase"
                                        >
                                            Ver Historial →
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {workoutHistory.slice(0, 3).map((workout, i) => (
                                            <RecentWorkoutCard key={workout.id || i} workout={workout} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* No data state fallback */}
                            {workoutHistory.length === 0 && (
                                <div className="text-center py-24 rounded-[40px] border border-dashed border-white/5 bg-slate-900/10">
                                    <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                                        <Dumbbell className="text-slate-700" size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black mb-2 tracking-tight">Comienza tu viaje</h3>
                                    <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                        Tu progreso aparecerá aquí después de completar tu primer entrenamiento.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6 max-w-3xl mx-auto"
                        >
                            {workoutHistory.length === 0 ? (
                                <div className="text-center py-24 rounded-[40px] border border-white/5 bg-slate-950">
                                    <Calendar className="mx-auto text-slate-800 mb-6" size={48} />
                                    <h3 className="text-xl font-black mb-2">Historial Vacío</h3>
                                    <p className="text-slate-500">Tus entrenamientos aparecerán listados aquí.</p>
                                </div>
                            ) : (
                                workoutHistory.map((workout, i) => (
                                    <WorkoutHistoryCard
                                        key={workout.id || i}
                                        workout={workout}
                                        expanded={expandedWorkout === workout.id}
                                        onToggle={() => setExpandedWorkout(
                                            expandedWorkout === workout.id ? null : workout.id
                                        )}
                                    />
                                ))
                            )}
                        </motion.div>
                    )}

                    {/* Records Tab */}
                    {activeTab === 'records' && (
                        <motion.div
                            key="records"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-8"
                        >
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3 mb-8">
                                <Trophy className="text-amber-400" size={18} /> Salón de la Fama
                            </h3>

                            {Object.keys(personalRecords).length === 0 ? (
                                <div className="text-center py-24 rounded-[40px] border border-white/5 bg-slate-950">
                                    <Trophy className="mx-auto text-slate-800 mb-6" size={48} />
                                    <h3 className="text-xl font-black mb-2 tracking-tight">Sin récords establecidos</h3>
                                    <p className="text-slate-500 max-w-xs mx-auto">Sigue entrenando pesado para ver tus mejores marcas aquí.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Object.entries(personalRecords)
                                        .sort((a, b) => b[1].weight - a[1].weight)
                                        .map(([exercise, pr], i) => (
                                            <PRCard
                                                key={exercise}
                                                exercise={exercise}
                                                pr={pr}
                                                onClick={() => loadExerciseProgress(exercise)}
                                            />
                                        ))
                                    }
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Weight Evolution Tab */}
                    {activeTab === 'weight' && (
                        <motion.div
                            key="weight"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            <div className="rounded-[40px] border border-white/5 bg-slate-950 p-8 md:p-12 relative overflow-hidden">
                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-purple-600/5 blur-[120px] pointer-events-none" />
                                <div className="flex items-center justify-between mb-12 relative z-10">
                                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <Scale className="text-purple-400" size={18} /> Evolución de Peso
                                    </h3>
                                </div>

                                {profile?.weightHistory && profile.weightHistory.length > 1 ? (
                                    <>
                                        <div className="h-72 w-full mt-8">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={profile.weightHistory.slice(-30).map(w => ({
                                                    date: new Date(w.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                                                    weight: w.weight
                                                }))}>
                                                    <defs>
                                                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                    <XAxis
                                                        dataKey="date"
                                                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                                                        domain={['dataMin - 2', 'dataMax + 2']}
                                                        tickFormatter={(v) => `${v}kg`}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: '#0f172a',
                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                            borderRadius: '16px',
                                                            fontSize: '11px',
                                                            fontWeight: 'bold',
                                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                        itemStyle={{ color: '#8B5CF6' }}
                                                        labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                                                        formatter={(value) => [`${value} kg`, 'Peso']}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="weight"
                                                        stroke="#8B5CF6"
                                                        strokeWidth={4}
                                                        fill="url(#weightGradient)"
                                                        animationDuration={2000}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Premium Stats Grid */}
                                        <div className="grid grid-cols-3 gap-6 mt-12 pb-8 border-b border-white/5">
                                            <div className="text-center">
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Actual</div>
                                                <div className="text-3xl font-black text-white tracking-tighter">
                                                    {profile.weight || profile.weightHistory[profile.weightHistory.length - 1]?.weight} <span className="text-xs text-slate-500">kg</span>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 text-emerald-500">Mínimo</div>
                                                <div className="text-3xl font-black text-white tracking-tighter">
                                                    {Math.min(...profile.weightHistory.map(w => w.weight))} <span className="text-xs text-slate-500">kg</span>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 text-orange-500">Máximo</div>
                                                <div className="text-3xl font-black text-white tracking-tighter">
                                                    {Math.max(...profile.weightHistory.map(w => w.weight))} <span className="text-xs text-slate-500">kg</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Trend Badge */}
                                        {profile.weightHistory.length >= 2 && (() => {
                                            const first = profile.weightHistory[0].weight;
                                            const last = profile.weightHistory[profile.weightHistory.length - 1].weight;
                                            const diff = (last - first).toFixed(1);
                                            const isGain = diff > 0;
                                            return (
                                                <div className="mt-8 flex justify-center">
                                                    <div className={`px-6 py-3 rounded-full flex items-center gap-3 border ${isGain ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                                        <TrendingUp className={isGain ? '' : 'rotate-180'} size={18} />
                                                        <span className="text-sm font-black uppercase tracking-widest">
                                                            {isGain ? 'Aumento' : 'Reducción'} de {Math.abs(diff)} kg <span className="text-[10px] opacity-60">desde inicio</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </>
                                ) : (
                                    <div className="text-center py-12">
                                        <Scale className="mx-auto text-slate-600 mb-4" size={48} />
                                        <h3 className="text-xl font-bold mb-2">Sin datos de peso</h3>
                                        <p className="text-slate-400 text-sm mb-4">
                                            Actualiza tu peso en el perfil para ver tu evolución
                                        </p>
                                        <button
                                            onClick={() => navigate('/profile')}
                                            className="bg-purple-600 px-6 py-2 rounded-xl font-bold text-sm"
                                        >
                                            Ir al Perfil
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Calendar Tab */}
                    {activeTab === 'calendar' && (
                        <motion.div
                            key="calendar"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <WorkoutCalendar workoutHistory={workoutHistory} />
                        </motion.div>
                    )}

                </AnimatePresence>

                {/* Exercise Progress Modal */}
                <AnimatePresence>
                    {selectedExercise && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6"
                            onClick={() => setSelectedExercise(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-slate-900 rounded-[40px] w-full max-w-lg overflow-hidden border border-white/10 shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-8 border-b border-white/5 bg-slate-950/50 flex items-center justify-between">
                                    <h3 className="font-black text-2xl tracking-tight text-white">{selectedExercise}</h3>
                                    <button
                                        onClick={() => setSelectedExercise(null)}
                                        className="p-2.5 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-colors"
                                    >
                                        <ChevronDown size={20} />
                                    </button>
                                </div>

                                <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Evolución del peso máximo</h4>

                                    {exerciseProgress.length > 0 ? (
                                        <div className="space-y-3">
                                            {exerciseProgress.slice().reverse().map((p, i) => (
                                                <div key={i} className="flex justify-between items-center bg-white/[0.02] p-5 rounded-[24px] border border-white/5 transition-all hover:bg-white/[0.04]">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                            {formatDate(p.date)}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-400 mt-1">Sesión #{(exerciseProgress.length - i)}</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-2xl font-black text-white tracking-tighter">{p.maxWeight}</span>
                                                        <span className="text-[10px] font-black text-slate-500 uppercase">kg</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 opacity-30">
                                            <TrendingUp size={48} className="mx-auto mb-4" />
                                            <p className="font-bold uppercase tracking-widest text-xs">Sin registros de progresión</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 bg-slate-950/30 border-t border-white/5">
                                    <button
                                        onClick={() => setSelectedExercise(null)}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-600/20"
                                    >
                                        Entendido
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <BottomNav />
        </div>
    );
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 pb-2 px-1 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${active ? 'text-blue-400 border-blue-400' : 'text-slate-500 border-transparent'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

// Sub-components
function StatCard({ icon, value, label, color = "indigo" }) {
    const colors = {
        indigo: "text-indigo-400",
        purple: "text-purple-400",
        emerald: "text-emerald-400",
        amber: "text-amber-400"
    };

    return (
        <div className="bg-white/[0.02] p-5 rounded-3xl border border-white/5 transition-all hover:bg-white/[0.04]">
            <div className={`mb-3 flex justify-center md:justify-start ${colors[color]}`}>{icon}</div>
            <div className="text-2xl font-black text-white tracking-tight">{value}</div>
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{label}</div>
        </div>
    );
}

function RecentWorkoutCard({ workout }) {
    const date = workout.startTime instanceof Date
        ? workout.startTime
        : new Date(workout.startTime);

    return (
        <div className="relative overflow-hidden group p-6 rounded-[32px] bg-slate-900/50 border border-white/5 transition-all duration-500 hover:border-emerald-500/30">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/[0.03] rounded-2xl text-emerald-400">
                    <Dumbbell size={20} />
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                        {date.toLocaleDateString('es-ES', { weekday: 'long' })}
                    </div>
                    <div className="text-sm font-black text-white">
                        {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </div>
                </div>
            </div>

            <h4 className="font-black text-lg text-white mb-2 line-clamp-1">{workout.dayName}</h4>
            <div className="flex items-center gap-4 pt-4 border-t border-white/5 mt-auto">
                <div className="flex items-center gap-2">
                    <Clock size={12} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-300">{workout.duration || 0}m</span>
                </div>
                <div className="flex items-center gap-2">
                    <Target size={12} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-300">{workout.totalSets || 0} series</span>
                </div>
            </div>
        </div>
    );
}

function WorkoutHistoryCard({ workout, expanded, onToggle }) {
    const date = workout.startTime instanceof Date
        ? workout.startTime
        : new Date(workout.startTime);

    return (
        <div className="relative overflow-hidden rounded-[40px] border border-white/5 bg-slate-950 transition-all duration-300">
            <button
                onClick={onToggle}
                className="w-full p-8 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors relative z-10"
            >
                <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${expanded ? 'bg-indigo-600 shadow-lg shadow-indigo-600/30 text-white' : 'bg-white/[0.03] text-indigo-400'}`}>
                        <Calendar size={28} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                            {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <h4 className="text-xl font-black text-white">{workout.dayName}</h4>
                        <div className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">{workout.dayFocus}</div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="hidden md:block text-right">
                        <div className="text-lg font-black text-white">{workout.duration || 0} <span className="text-[10px] text-slate-500 italic uppercase">min</span></div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            {((workout.totalVolume || 0) / 1000).toFixed(1)}k kg movido
                        </div>
                    </div>
                    <div className={`p-3 rounded-full bg-white/[0.03] transition-transform duration-500 ${expanded ? 'rotate-180 bg-indigo-500/10 text-indigo-400' : 'text-slate-700'}`}>
                        <ChevronDown size={20} />
                    </div>
                </div>
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-8 pb-8 pt-4 space-y-4">
                            <div className="h-[1px] bg-white/5 w-full mb-6" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {workout.exercises?.map((ex, i) => (
                                    <div key={i} className="flex justify-between items-center bg-slate-900/50 p-4 rounded-[24px] border border-white/5">
                                        <div className="flex items-center gap-3">
                                            {ex.personalRecord && (
                                                <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500">
                                                    <Trophy size={14} />
                                                </div>
                                            )}
                                            <span className="font-black text-sm text-slate-200">{ex.name}</span>
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-3 py-1.5 rounded-xl border border-white/5">
                                            {ex.sets?.map(s => `${s.weight}×${s.reps}`).join(', ') || 'Sin datos'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function PRCard({ exercise, pr, onClick }) {
    const date = pr.date instanceof Date ? pr.date : new Date(pr.date);

    return (
        <button
            onClick={onClick}
            className="group relative overflow-hidden p-8 rounded-[40px] border border-white/5 bg-slate-950 text-left transition-all duration-500 hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/5"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />

            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/[0.03] rounded-2xl text-amber-400 border border-white/5 shadow-inner">
                    <Trophy size={22} />
                </div>
                <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</div>
                    <h4 className="font-black text-lg text-white tracking-tight">{exercise}</h4>
                </div>
            </div>

            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-amber-400 tracking-tighter">{pr.weight}</span>
                <span className="text-sm font-black text-slate-500 italic">kg</span>
                <span className="text-lg font-black text-white ml-2">× {pr.reps}</span>
            </div>

            <div className="mt-8 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Récord Personal</span>
                <div className="p-2 rounded-xl bg-slate-900 text-slate-700 transition-colors group-hover:text-amber-400">
                    <ChevronRight size={16} />
                </div>
            </div>
        </button>
    );
}
