// Workout Summary - Post-workout review and stats component
import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, Dumbbell, TrendingUp, X, Share2, CheckCircle } from 'lucide-react';

export default function WorkoutSummary({
    workout,
    summary = {},
    onClose,
    onShare
}) {
    const { duration = 0, totalVolume = 0, totalSets = 0, personalRecords = [] } = summary;

    const volumeKg = (totalVolume / 1000).toFixed(1);
    const hasNewPRs = personalRecords && personalRecords.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden"
            >
                {/* Header with celebration */}
                <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-8 text-center relative overflow-hidden">
                    {/* Confetti effect */}
                    <div className="absolute inset-0 opacity-20">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA'][i % 4],
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`
                                }}
                                animate={{
                                    y: [0, -10, 0],
                                    opacity: [1, 0.5, 1]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2
                                }}
                            />
                        ))}
                    </div>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="relative"
                    >
                        <CheckCircle size={64} className="mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">¡Entrenamiento Completado!</h2>
                        <p className="text-white/80">{workout?.dayName || 'Gran trabajo hoy'}</p>
                    </motion.div>
                </div>

                {/* Stats Grid */}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <StatBox
                            icon={<Clock size={20} className="text-blue-400" />}
                            value={`${duration}`}
                            label="minutos"
                        />
                        <StatBox
                            icon={<Dumbbell size={20} className="text-purple-400" />}
                            value={volumeKg}
                            label="kg total"
                        />
                        <StatBox
                            icon={<TrendingUp size={20} className="text-green-400" />}
                            value={totalSets}
                            label="series"
                        />
                    </div>

                    {/* Personal Records */}
                    {hasNewPRs && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-4"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Trophy size={20} className="text-yellow-500" />
                                <span className="font-bold text-yellow-500">
                                    {personalRecords.length === 1 ? 'Nuevo Récord Personal!' : `${personalRecords.length} Nuevos Récords!`}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {personalRecords.map((pr, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + i * 0.1 }}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <span className="text-yellow-400">🏆</span>
                                        <span className="text-white">{pr}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Exercise Summary */}
                    {workout?.exercises && (
                        <div className="bg-slate-800/50 rounded-2xl p-4">
                            <h4 className="text-sm font-bold text-slate-400 mb-3">Resumen de Ejercicios</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {workout.exercises.map((ex, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <span className="text-white truncate flex-1">
                                            {ex.personalRecord && <Trophy size={12} className="inline text-yellow-500 mr-1" />}
                                            {ex.name}
                                        </span>
                                        <span className="text-slate-400 font-mono">
                                            {ex.sets?.length || 0}/{ex.targetSets} sets
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-3">
                    {onShare && (
                        <button
                            onClick={onShare}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            <Share2 size={18} />
                            Compartir
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        Continuar
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function StatBox({ icon, value, label }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 rounded-2xl p-3 text-center"
        >
            <div className="flex justify-center mb-1">{icon}</div>
            <div className="text-xl font-bold">{value}</div>
            <div className="text-[10px] text-slate-500 uppercase">{label}</div>
        </motion.div>
    );
}
