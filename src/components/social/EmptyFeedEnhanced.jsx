import React from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Flame, Dumbbell, Zap, UserPlus, Sparkles } from 'lucide-react';

const EmptyFeedEnhanced = ({ onExplore, onInvite, onEnableDemo }) => {
    // Animated workout illustration
    const WorkoutIllustration = () => (
        <div className="relative w-32 h-32 mx-auto mb-6">
            {/* Background circles */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
                className="absolute inset-4 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.2 }}
            />

            {/* Center icon */}
            <motion.div
                className="absolute inset-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30"
                animate={{
                    rotate: [0, 5, -5, 0],
                    y: [0, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
            >
                <Users size={32} className="text-white" />
            </motion.div>

            {/* Floating elements */}
            <motion.div
                className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center"
                animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
            >
                <Trophy size={16} className="text-white" />
            </motion.div>

            <motion.div
                className="absolute -bottom-2 -left-2 w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center"
                animate={{ y: [0, 8, 0], rotate: [0, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            >
                <Dumbbell size={16} className="text-white" />
            </motion.div>

            <motion.div
                className="absolute top-1/2 -left-4 w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center"
                animate={{ x: [0, -5, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
                <Flame size={12} className="text-white" />
            </motion.div>
        </div>
    );

    const features = [
        { icon: Trophy, text: 'Compite en leaderboards semanales', color: 'text-amber-400' },
        { icon: Flame, text: 'Celebra los PRs de tus amigos', color: 'text-orange-400' },
        { icon: Zap, text: 'Ve quién está entrenando en vivo', color: 'text-green-400' },
        { icon: Users, text: 'Encuentra compañeros de entreno', color: 'text-purple-400' }
    ];

    return (
        <motion.div
            className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-3xl p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/images/gym_community_bg.png"
                    alt=""
                    className="w-full h-full object-cover opacity-25"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-slate-900/60" />
            </div>

            {/* Content */}
            <div className="relative z-10">
                <WorkoutIllustration />

                <h3 className="text-xl font-bold text-white mb-2">
                    ¡Bienvenido a la comunidad!
                </h3>
                <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
                    Conecta con otros atletas, compite en desafíos y celebra logros juntos.
                </p>

                {/* Feature list */}
                <div className="space-y-3 mb-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            className="flex items-center gap-3 bg-slate-900/70 backdrop-blur rounded-xl px-4 py-2.5 text-left"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i }}
                        >
                            <feature.icon size={16} className={feature.color} />
                            <span className="text-sm text-slate-300">{feature.text}</span>
                        </motion.div>
                    ))}
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                    <button
                        onClick={onExplore}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <Users size={18} />
                        Explorar la comunidad
                    </button>

                    <button
                        onClick={onInvite}
                        className="w-full bg-slate-800/80 border border-white/10 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
                    >
                        <UserPlus size={18} />
                        Invitar amigos
                    </button>

                    <button
                        onClick={onEnableDemo}
                        className="w-full text-slate-500 hover:text-blue-400 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <Sparkles size={14} />
                        Ver demo de la comunidad
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default EmptyFeedEnhanced;
