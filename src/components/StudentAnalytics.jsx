import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import {
    Activity, TrendingUp, Calendar, Clock, Dumbbell,
    Trophy, ChevronRight, Info, Zap, Flame, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentAnalytics({ analyticsData, studentName }) {
    const [selectedExercise, setSelectedExercise] = useState('');
    const [drillDownSession, setDrillDownSession] = useState(null);
    const [activeTab, setActiveTab] = useState('progression'); // progression | exercises | cardio

    const { summary, charts, cardio, recentHistory } = analyticsData;
    const exerciseNames = Object.keys(charts.exercises).sort();

    useEffect(() => {
        if (exerciseNames.length > 0 && !selectedExercise) {
            setSelectedExercise(exerciseNames[0]);
        }
    }, [exerciseNames]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="text-sm font-bold text-indigo-400">
                        {payload[0].value.toLocaleString()} {payload[0].unit || 'kg'}
                    </p>
                    {payload[0].payload.name && (
                        <p className="text-[10px] text-slate-500 mt-1 italic">{payload[0].payload.name}</p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Volumen Total', value: `${(summary.totalVolume / 1000).toFixed(1)}k`, unit: 'kg', icon: TrendingUp, color: 'text-indigo-400' },
                    { label: 'Entrenamientos', value: summary.totalWorkouts, unit: 'sesiones', icon: Activity, color: 'text-emerald-400' },
                    { label: 'Récords (PRs)', value: summary.prCount, unit: 'logrados', icon: Trophy, color: 'text-yellow-400' },
                    { label: 'Promedio Sesión', value: summary.avgDuration, unit: 'min', icon: Clock, color: 'text-blue-400' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/[0.03] border border-white/5 p-3 md:p-4 rounded-2xl"
                    >
                        <div className="flex items-center gap-2 mb-1 md:mb-2">
                            <stat.icon size={14} className={stat.color} />
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl md:text-2xl font-black">{stat.value}</span>
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-600 uppercase">{stat.unit}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Tabs */}
            <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/5">
                {['progression', 'exercises', 'cardio'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-1.5 md:py-2 text-[9px] md:text-xs font-bold uppercase tracking-wider md:tracking-widest rounded-lg transition-all ${activeTab === tab ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {tab === 'progression' ? 'Volumen' : tab === 'exercises' ? 'Fuerza' : 'Cardio'}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 min-h-[400px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'progression' && (
                        <motion.div
                            key="volume"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-base md:text-lg font-bold">Progresión de Carga Total</h3>
                                    <p className="text-[10px] md:text-xs text-slate-500 italic">Suma de todos los kg levantados por sesión</p>
                                </div>
                                <div className="md:text-right">
                                    {summary.volumeChange !== null ? (
                                        <span className={`text-[9px] md:text-[10px] font-black px-2 py-1 rounded-lg ${Number(summary.volumeChange) >= 0
                                            ? 'text-emerald-400 bg-emerald-400/10'
                                            : 'text-red-400 bg-red-400/10'
                                            }`}>
                                            {Number(summary.volumeChange) >= 0 ? '+' : ''}{summary.volumeChange}% vs mes anterior
                                        </span>
                                    ) : (
                                        <span className="text-[9px] md:text-[10px] font-black text-slate-500 bg-white/5 px-2 py-1 rounded-lg">
                                            Sin data comparativa
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="h-[300px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={charts.volumeTrend}>
                                        <defs>
                                            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#475569"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => val.split('/')[0] + '/' + val.split('/')[1]}
                                        />
                                        <YAxis
                                            stroke="#475569"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="volume"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorVolume)"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'exercises' && (
                        <motion.div
                            key="exercises"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">RM Estimado & Fuerza</h3>
                                    <p className="text-xs text-slate-500">Evolución del peso máximo por ejercicio</p>
                                </div>
                                <select
                                    value={selectedExercise}
                                    onChange={(e) => setSelectedExercise(e.target.value)}
                                    className="bg-slate-800 border border-white/10 text-white p-2 rounded-xl text-xs w-full sm:w-auto"
                                >
                                    {exerciseNames.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="h-[300px] w-full">
                                {selectedExercise && charts.exercises[selectedExercise] ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={charts.exercises[selectedExercise]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#475569"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(val) => val.split('/')[0] + '/' + val.split('/')[1]}
                                            />
                                            <YAxis
                                                stroke="#475569"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Line
                                                type="stepAfter"
                                                dataKey="maxWeight"
                                                stroke="#8b5cf6"
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                                animationDuration={1500}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-4">
                                        <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
                                            <TrendingUp size={30} />
                                        </div>
                                        <p className="font-bold text-slate-300">Sin datos de progresión todavía</p>
                                        <p className="text-[10px] mt-1 max-w-[200px]">Este ejercicio forma parte de la rutina activa pero el alumno aún no ha registrado ninguna serie.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'cardio' && (
                        <motion.div
                            key="cardio"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold">Actividades Cardio & Extra</h3>
                                    <p className="text-xs text-slate-500">Últimos 30 días de actividad complementaria</p>
                                </div>
                                <div className="bg-orange-500/10 p-2 rounded-xl border border-orange-500/20">
                                    <Flame size={20} className="text-orange-400" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                {cardio.length > 0 ? cardio.map((activity, idx) => (
                                    <div key={idx} className="bg-white/[0.03] p-4 rounded-2xl flex items-center justify-between border border-white/5 hover:bg-white/[0.05] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                                                <Flame size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-200">{activity.name}</div>
                                                <div className="text-[10px] text-slate-500 flex items-center gap-2 font-bold uppercase tracking-wider">
                                                    <span>{new Date(activity.date + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                                                    <span className="opacity-30">•</span>
                                                    <span className="flex items-center gap-1"><Clock size={10} /> {activity.durationMinutes} MIN</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-orange-400">-{activity.caloriesBurned}</div>
                                            <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">KCAL</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center text-slate-600 italic">
                                        No hay actividades de cardio registradas recientemente
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Session Timeline / Drill-down */}
            <div className="mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-indigo-400" />
                    Historial de Sesiones
                </h3>
                <div className="space-y-4">
                    {recentHistory.map((workout, i) => (
                        <div key={workout.id} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                            <button
                                onClick={() => setDrillDownSession(drillDownSession === workout.id ? null : workout.id)}
                                className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black border border-indigo-500/20">
                                        {workout.date.getDate()}
                                        <span className="text-[8px] opacity-60 ml-0.5">{workout.date.toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-slate-200">{workout.dayName || 'Entrenamiento'}</div>
                                        <div className="text-[10px] text-slate-500 flex items-center gap-2 font-bold uppercase tracking-wider">
                                            <span className="flex items-center gap-1"><Dumbbell size={10} /> {workout.exercises?.length || 0} Ejercicios</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><Zap size={10} /> {(workout.totalVolume / 1000).toFixed(1)}k kg</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight
                                    size={20}
                                    className={`text-slate-600 transition-transform ${drillDownSession === workout.id ? 'rotate-90' : ''}`}
                                />
                            </button>

                            <AnimatePresence>
                                {drillDownSession === workout.id && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden bg-white/[0.01] border-t border-white/5"
                                    >
                                        <div className="p-4 space-y-4">
                                            {workout.exercises?.map((ex, exIdx) => (
                                                <div key={exIdx} className="bg-black/20 p-3 rounded-xl border border-white/5">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-bold text-slate-300">{ex.name}</span>
                                                        {ex.personalRecord && (
                                                            <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/20 flex items-center gap-1">
                                                                <Trophy size={10} /> PR
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(ex.sets || []).map((set, setIdx) => (
                                                            <div key={setIdx} className="bg-slate-800/50 px-3 py-1 rounded-lg border border-white/5 flex items-baseline gap-1">
                                                                <span className="text-xs font-black text-indigo-300">{set.weight}</span>
                                                                <span className="text-[8px] text-slate-500 uppercase">kg</span>
                                                                <span className="text-[10px] text-slate-500 mx-1">×</span>
                                                                <span className="text-xs font-bold">{set.reps}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            {workout.notes && (
                                                <div className="bg-blue-500/5 p-3 rounded-xl border border-blue-500/20 text-xs text-blue-300/80">
                                                    <Info size={14} className="inline mr-2" />
                                                    Notas: {workout.notes}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
