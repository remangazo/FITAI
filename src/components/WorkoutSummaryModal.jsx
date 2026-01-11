/**
 * WorkoutSummaryModal - Modal de resumen post-entrenamiento
 * Muestra estadísticas detalladas del entrenamiento completado
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Trophy, Clock, Dumbbell, Flame, Target,
    TrendingUp, Award, CheckCircle2, Zap, Star
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, unit, highlight }) => (
    <div className={`bg-slate-800/50 rounded-xl p-4 border ${highlight ? 'border-amber-500/50' : 'border-white/5'}`}>
        <div className="flex items-center gap-2 mb-1">
            <Icon size={16} className={highlight ? 'text-amber-400' : 'text-blue-400'} />
            <span className="text-sm text-slate-400">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${highlight ? 'text-amber-400' : 'text-white'}`}>{value}</span>
            {unit && <span className="text-slate-500 text-sm">{unit}</span>}
        </div>
    </div>
);

export default function WorkoutSummaryModal({ summary, onClose }) {
    if (!summary) return null;

    const {
        duration = 0,
        totalVolume = 0,
        totalSets = 0,
        personalRecords = [],
        caloriesBurned = 0,
        exercisesCompleted = 0,
        dayName = 'Entrenamiento'
    } = summary;

    // Formatear volumen
    const formattedVolume = totalVolume >= 1000
        ? `${(totalVolume / 1000).toFixed(1)}k`
        : totalVolume.toString();

    // Determinar mensaje motivacional basado en el rendimiento
    const getMotivationalMessage = () => {
        if (personalRecords.length >= 3) return '¡ENTRENAMIENTO LEGENDARIO! 🔥';
        if (personalRecords.length >= 1) return '¡NUEVO RÉCORD PERSONAL! 🏆';
        if (duration >= 60) return '¡SESIÓN ÉPICA! 💪';
        if (totalSets >= 20) return '¡ALTO VOLUMEN! 📊';
        return '¡BUEN TRABAJO! ✅';
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-slate-900 rounded-[32px] border border-white/10 max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] shadow-2xl shadow-emerald-500/10"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header with confetti-like gradient */}
                    <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-6 md:p-8 text-center relative overflow-hidden flex-shrink-0">
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="relative"
                        >
                            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3">
                                <CheckCircle2 size={32} className="text-white" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight">{getMotivationalMessage()}</h2>
                            <p className="text-white/80 text-[10px] md:text-sm font-black uppercase tracking-[0.2em]">{dayName}</p>
                        </motion.div>
                    </div>

                    {/* Stats Grid - Scrollable area */}
                    <div className="p-5 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <StatCard
                                icon={Clock}
                                label="Duración"
                                value={duration}
                                unit="min"
                            />
                            <StatCard
                                icon={Dumbbell}
                                label="Volumen Total"
                                value={formattedVolume}
                                unit="kg"
                            />
                            <StatCard
                                icon={Target}
                                label="Series"
                                value={totalSets}
                            />
                            <StatCard
                                icon={Flame}
                                label="Calorías"
                                value={caloriesBurned}
                                unit="kcal"
                            />
                        </div>

                        {/* Personal Records */}
                        {personalRecords.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-5"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-amber-500/20 rounded-xl">
                                        <Trophy className="text-amber-400" size={18} />
                                    </div>
                                    <span className="font-black text-amber-400 text-sm uppercase tracking-wider">
                                        {personalRecords.length} {personalRecords.length === 1 ? 'Récord Personal' : 'Récords Personales'}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {personalRecords.map((pr, index) => (
                                        <div key={index} className="flex items-center gap-3 text-sm">
                                            <Star size={14} className="text-amber-400 fill-amber-400" />
                                            <span className="text-slate-200 font-bold">{pr}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Volume Explanation */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5">
                            <div className="flex items-center gap-3 text-slate-400 mb-2">
                                <TrendingUp size={16} className="text-emerald-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Progreso Inteligente</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed italic">
                                <strong>Volumen Total:</strong> Peso × Series × Reps.
                                Mantén la progresión de carga para optimizar la hipertrofia.
                            </p>
                        </div>

                        {/* Close Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className="w-full bg-white text-slate-950 font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-slate-100 shadow-xl shadow-black/20"
                        >
                            <Zap size={18} fill="currentColor" />
                            FINALIZAR SESIÓN
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
