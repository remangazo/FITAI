/**
 * ActivityTracker Component - FitAI
 * 
 * Permite al usuario registrar actividad física adicional (cardio, caminatas, etc.)
 * y calcula las calorías quemadas en tiempo real.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Flame,
    Clock,
    Plus,
    X,
    Check,
    Dumbbell,
    Heart,
    Sparkles,
    Zap,
    ChevronRight
} from 'lucide-react';
import { calculateActivityCalories, getAvailableActivities } from '../services/metabolicCalculator';
import { useAuth } from '../context/AuthContext';

const ACTIVITY_ICONS = {
    cardio: <Heart size={18} />,
    strength: <Dumbbell size={18} />,
    flexibility: <Sparkles size={18} />,
    other: <Activity size={18} />
};

export default function ActivityTracker({ onActivityAdded, dailyActivities = [] }) {
    const { profile } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [duration, setDuration] = useState(30);
    const [calculatedCalories, setCalculatedCalories] = useState(0);

    const activities = getAvailableActivities();
    const userWeight = parseFloat(profile?.weight) || 70;

    // Calcular calorías cuando cambia la actividad o duración
    useEffect(() => {
        if (selectedActivity) {
            const result = calculateActivityCalories(selectedActivity.id, duration, userWeight);
            setCalculatedCalories(result.caloriesBurned);
        }
    }, [selectedActivity, duration, userWeight]);

    // Calcular total de calorías quemadas hoy
    const totalBurned = dailyActivities.reduce((sum, act) => sum + (act.caloriesBurned || 0), 0);

    const handleAddActivity = () => {
        if (selectedActivity && duration > 0) {
            const activity = {
                id: Date.now().toString(),
                activityId: selectedActivity.id,
                name: selectedActivity.name,
                category: selectedActivity.category,
                durationMinutes: duration,
                caloriesBurned: calculatedCalories,
                addedAt: new Date().toISOString()
            };

            onActivityAdded(activity);
            setIsModalOpen(false);
            setSelectedActivity(null);
            setDuration(30);
        }
    };

    const groupedActivities = activities.reduce((groups, activity) => {
        const category = activity.category;
        if (!groups[category]) groups[category] = [];
        groups[category].push(activity);
        return groups;
    }, {});

    const categoryNames = {
        cardio: 'Cardio',
        strength: 'Fuerza',
        flexibility: 'Flexibilidad',
        other: 'Otras'
    };

    return (
        <div className="relative z-10">
            {/* Summary Card with Premium Style */}
            <div className="relative overflow-hidden bg-slate-900 border border-white/5 p-8 rounded-[40px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-center text-indigo-400">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Actividad Extra</h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Cardio y Deportes</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-emerald-400">+{totalBurned}</div>
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">kcal bonus</div>
                    </div>
                </div>

                {/* Today's Activities */}
                {dailyActivities.length > 0 ? (
                    <div className="space-y-3 mb-8">
                        {dailyActivities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-center justify-between bg-white/[0.02] p-4 rounded-3xl border border-white/5 hover:border-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl bg-white/5 ${activity.category === 'cardio' ? 'text-red-400' :
                                            activity.category === 'strength' ? 'text-blue-400' :
                                                'text-emerald-400'
                                        }`}>
                                        {ACTIVITY_ICONS[activity.category] || ACTIVITY_ICONS.other}
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-white uppercase tracking-tight">{activity.name}</div>
                                        <div className="text-[10px] text-slate-500 font-bold">{activity.durationMinutes} min</div>
                                    </div>
                                </div>
                                <div className="text-sm font-black text-emerald-400">
                                    -{activity.caloriesBurned} kcal
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 text-center mb-8">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">
                            No has registrado actividad adicional hoy. <br />Tus entrenos de rutina se cuentan aparte.
                        </p>
                    </div>
                )}

                {/* Add Activity Button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-indigo-500 hover:bg-indigo-400 text-white py-5 rounded-[24px] font-black text-sm tracking-tight flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/10 transition-all border border-indigo-400/20"
                >
                    <Plus size={20} />
                    REGISTRAR ACTIVIDAD
                </motion.button>
            </div>

            {/* Premium Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-lg overflow-hidden relative z-10 shadow-3xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">Elegir Actividad</h2>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Sincronización metabólica</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                                {!selectedActivity ? (
                                    <div className="space-y-8">
                                        {Object.entries(groupedActivities).map(([category, acts]) => (
                                            <div key={category}>
                                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                                    <span className={`w-1 h-3 rounded-full ${category === 'cardio' ? 'bg-red-500' :
                                                            category === 'strength' ? 'bg-blue-500' :
                                                                'bg-emerald-500'
                                                        }`} />
                                                    {categoryNames[category]}
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {acts.map((activity) => (
                                                        <button
                                                            key={activity.id}
                                                            onClick={() => setSelectedActivity(activity)}
                                                            className="p-5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-3xl text-left transition-all hover:border-white/20 group"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{activity.name}</span>
                                                                <ChevronRight size={14} className="text-slate-700" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        <div className="bg-indigo-500/10 p-6 rounded-[32px] border border-indigo-500/20 text-center">
                                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Configurando</div>
                                            <h4 className="text-2xl font-black text-white">{selectedActivity.name}</h4>
                                        </div>

                                        {/* Custom Duration Input */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Duración</label>
                                                <span className="text-2xl font-black text-white">{duration} <span className="text-sm text-slate-500">min</span></span>
                                            </div>
                                            <input
                                                type="range"
                                                min="5"
                                                max="180"
                                                step="5"
                                                value={duration}
                                                onChange={(e) => setDuration(parseInt(e.target.value))}
                                                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 slider-thumb"
                                            />
                                            <div className="grid grid-cols-5 gap-2">
                                                {[15, 30, 45, 60, 90].map((d) => (
                                                    <button
                                                        key={d}
                                                        onClick={() => setDuration(d)}
                                                        className={`py-3 rounded-2xl font-black text-xs transition-all ${duration === d
                                                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {d}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Burn Prediction Row */}
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[32px] text-center relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl pointer-events-none" />
                                            <Zap className="text-emerald-400 mx-auto mb-3" size={32} />
                                            <div className="text-5xl font-black text-white tracking-tighter mb-2">
                                                -{calculatedCalories}
                                            </div>
                                            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Estimación Metabólica</div>
                                            <p className="text-[9px] text-slate-500 font-bold mt-4 uppercase tracking-widest">Basado en tu peso actual: {userWeight}kg</p>
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setSelectedActivity(null)}
                                                className="flex-1 py-5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-3xl font-black text-slate-400 transition-all uppercase text-xs tracking-widest"
                                            >
                                                Atrás
                                            </button>
                                            <button
                                                onClick={handleAddActivity}
                                                className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-3xl font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/10 uppercase text-xs tracking-widest"
                                            >
                                                <Check size={18} />
                                                REGISTRAR
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
