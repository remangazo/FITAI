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

    // IA Coach Feedback System
    const getCoachFeedback = () => {
        // Incomplete / Very short session logic
        if (totalSets <= 3 || duration < 5) {
            return {
                title: 'SESIÓN INCOMPLETA ⚠️',
                subtitle: 'Hiciste lo más difícil: empezar. Pero la disciplina se construye terminando el plan.',
                gradient: 'from-slate-700 via-slate-800 to-slate-900',
                icon: Award,
                iconBg: 'bg-white/10'
            };
        }

        // Standard / High Performance logic
        if (personalRecords.length >= 3) {
            return {
                title: '¡ENTRENAMIENTO LEGENDARIO! 🔥',
                subtitle: 'Estás en otro nivel. Tu cuerpo y mente te lo van a agradecer.',
                gradient: 'from-indigo-600 via-purple-600 to-pink-600',
                icon: Trophy,
                iconBg: 'bg-white/20'
            };
        }

        if (personalRecords.length >= 1) {
            return {
                title: '¡NUEVO RÉCORD PERSONAL! 🏆',
                subtitle: 'Superarse a uno mismo es la única competencia que importa.',
                gradient: 'from-amber-500 via-orange-600 to-yellow-600',
                icon: Zap,
                iconBg: 'bg-white/20'
            };
        }

        if (duration >= 60 || totalSets >= 18) {
            return {
                title: '¡SESIÓN ÉPICA FINALIZADA! 💪',
                subtitle: 'Gran volumen de trabajo hoy. El descanso de hoy será merecido.',
                gradient: 'from-blue-600 via-indigo-600 to-blue-700',
                icon: Flame,
                iconBg: 'bg-white/20'
            };
        }

        return {
            title: '¡ENTRENAMIENTO CUMPLIDO! ✅',
            subtitle: 'Un paso más hacia tu mejor versión. ¡Seguí así!',
            gradient: 'from-emerald-500 via-green-600 to-teal-700',
            icon: CheckCircle2,
            iconBg: 'bg-white/20'
        };
    };

    const coach = getCoachFeedback();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-slate-900 rounded-t-[40px] sm:rounded-[40px] border-t sm:border border-white/10 max-w-md w-full overflow-hidden flex flex-col max-h-[95vh] shadow-2xl shadow-emerald-500/20"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header with dynamic gradient based on performance */}
                    <div className={`bg-gradient-to-br ${coach.gradient} p-6 md:p-8 text-center relative overflow-hidden flex-shrink-0`}>
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="relative"
                        >
                            <div className={`w-16 h-16 md:w-20 md:h-20 mx-auto ${coach.iconBg} rounded-full flex items-center justify-center mb-3 shadow-lg backdrop-blur-md`}>
                                <coach.icon size={32} className="text-white" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight leading-tight">{coach.title}</h2>
                            <p className="text-white/80 text-[10px] md:text-xs font-bold px-4">{coach.subtitle}</p>
                        </motion.div>
                    </div>

                    {/* Stats Grid - Scrollable area */}
                    <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar pb-32 sm:pb-8">
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
                            className="w-full bg-gradient-to-r from-white via-slate-100 to-slate-200 text-slate-950 font-black py-4.5 px-6 rounded-[24px] flex items-center justify-center gap-2 transition-all shadow-xl shadow-white/5 border-t border-white"
                        >
                            <CheckCircle2 size={18} />
                            FINALIZAR SESIÓN
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
