/**
 * PremiumLock Component
 * 
 * Wrapper component that shows a blur overlay with upgrade prompt
 * when the user doesn't have Premium access to a feature.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePremium } from '../hooks/usePremium';

const featureMessages = {
    aiCoach: {
        title: 'AI Coach Completo',
        description: 'Análisis avanzado con recomendaciones personalizadas'
    },
    exportPDF: {
        title: 'Exportar a PDF',
        description: 'Descarga tus rutinas y dietas en formato PDF'
    },
    customDiet: {
        title: 'Dieta Personalizada',
        description: 'Plan nutricional adaptado a tu cultura y preferencias'
    },
    unlimitedRoutines: {
        title: 'Rutinas Ilimitadas',
        description: 'Genera todas las rutinas que necesites'
    },
    fullHistory: {
        title: 'Historial Completo',
        description: 'Accede a todo tu historial de entrenamientos'
    },
    progression: {
        title: 'Análisis de Progresión',
        description: 'Gráficos y predicciones de tu evolución'
    }
};

export default function PremiumLock({
    feature = 'default',
    children,
    showBlur = true,
    compact = false
}) {
    const navigate = useNavigate();
    const { isPremium } = usePremium();

    // Si es Premium, mostrar el contenido sin bloqueo
    if (isPremium) {
        return <>{children}</>;
    }

    const featureInfo = featureMessages[feature] || {
        title: 'Función Premium',
        description: 'Desbloquea esta función con Premium'
    };

    if (compact) {
        return (
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/upgrade')}
                className="w-full p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 hover:border-amber-500/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Lock size={16} className="text-amber-400" />
                    <span className="text-sm text-amber-400 font-medium">{featureInfo.title}</span>
                </div>
                <Crown size={16} className="text-amber-400" />
            </motion.button>
        );
    }

    return (
        <div className="relative">
            {/* Contenido bloqueado con blur */}
            {showBlur && (
                <div className="blur-sm opacity-50 pointer-events-none select-none">
                    {children}
                </div>
            )}

            {/* Overlay con prompt de upgrade */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${showBlur ? 'absolute inset-0' : ''} flex items-center justify-center bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm rounded-2xl p-6`}
            >
                <div className="text-center max-w-xs">
                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center">
                        <Crown size={32} className="text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mb-2">
                        {featureInfo.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-400 mb-4">
                        {featureInfo.description}
                    </p>

                    {/* Upgrade Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/upgrade')}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
                    >
                        <Sparkles size={18} />
                        Obtener Premium
                    </motion.button>

                    {/* Price hint */}
                    <p className="text-xs text-slate-500 mt-3">
                        Desde $4.99/mes • Cancela cuando quieras
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

/**
 * Premium Badge Component
 * Muestra un badge de Premium en el navbar o perfil
 */
export function PremiumBadge({ className = '' }) {
    const { isPremium } = usePremium();

    if (!isPremium) return null;

    return (
        <span className={`bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${className}`}>
            <Crown size={10} />
            PRO
        </span>
    );
}

/**
 * Premium Feature Tag
 * Small tag to indicate a feature requires Premium
 */
export function PremiumTag() {
    return (
        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">
            PRO
        </span>
    );
}
