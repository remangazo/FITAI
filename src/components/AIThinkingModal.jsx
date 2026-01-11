/**
 * AIThinkingModal - Animación de "IA pensando"
 * 
 * Muestra una animación atractiva mientras se "procesa" la rutina.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Dumbbell, Target, Zap, CheckCircle, UtensilsCrossed, Apple } from 'lucide-react';
const routineSteps = [
    { icon: Brain, text: 'Analizando tu perfil...', duration: 800 },
    { icon: Target, text: 'Seleccionando ejercicios óptimos...', duration: 1000 },
    { icon: Dumbbell, text: 'Estructurando tu rutina...', duration: 900 },
    { icon: Zap, text: 'Aplicando técnicas de intensidad...', duration: 700 },
    { icon: CheckCircle, text: '¡Rutina lista!', duration: 500 }
];

const nutritionSteps = [
    { icon: Brain, text: 'Analizando metabolismo...', duration: 800 },
    { icon: Target, text: 'Calculando macros ideales...', duration: 1000 },
    { icon: UtensilsCrossed, text: 'Distribuyendo comidas...', duration: 900 },
    { icon: Apple, text: 'Buscando recetas premium...', duration: 700 },
    { icon: CheckCircle, text: '¡Dieta generada!', duration: 500 }
];

export default function AIThinkingModal({ isOpen, onComplete, mode = 'routine' }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [completed, setCompleted] = useState(false);

    const steps = mode === 'nutrition' ? nutritionSteps : routineSteps;

    useEffect(() => {
        if (!isOpen) {
            setCurrentStep(0);
            setCompleted(false);
            return;
        }

        let timeout;

        const runSteps = async () => {
            for (let i = 0; i < steps.length; i++) {
                setCurrentStep(i);
                await new Promise(resolve => {
                    timeout = setTimeout(resolve, steps[i].duration);
                });
            }
            setCompleted(true);
            // Pequeño delay antes de cerrar
            await new Promise(resolve => {
                timeout = setTimeout(resolve, 400);
            });
            onComplete?.();
        };

        runSteps();

        return () => clearTimeout(timeout);
    }, [isOpen, onComplete, steps]);

    if (!isOpen) return null;

    const CurrentIcon = steps[currentStep]?.icon || Brain;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-slate-900 rounded-3xl border border-white/10 p-8 max-w-sm w-full text-center"
                >
                    {/* Animated Brain */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        {/* Outer ring */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-full border-2 border-dashed border-blue-500/30"
                        />

                        {/* Inner pulsing circle */}
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center"
                        >
                            <motion.div
                                key={currentStep}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200 }}
                            >
                                <CurrentIcon size={36} className="text-white" />
                            </motion.div>
                        </motion.div>

                        {/* Floating particles */}
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-blue-400 rounded-full"
                                animate={{
                                    x: [0, Math.cos(i * 60 * Math.PI / 180) * 40],
                                    y: [0, Math.sin(i * 60 * Math.PI / 180) * 40],
                                    opacity: [0, 1, 0]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.2
                                }}
                                style={{
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)'
                                }}
                            />
                        ))}
                    </div>

                    {/* Current step text */}
                    <motion.p
                        key={currentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lg font-medium text-white mb-4"
                    >
                        {steps[currentStep]?.text}
                    </motion.p>

                    {/* Progress dots */}
                    <div className="flex justify-center gap-2">
                        {steps.map((_, idx) => (
                            <motion.div
                                key={idx}
                                className={`w-2 h-2 rounded-full ${idx < currentStep
                                    ? 'bg-green-500'
                                    : idx === currentStep
                                        ? 'bg-blue-500'
                                        : 'bg-slate-700'
                                    }`}
                                animate={idx === currentStep ? { scale: [1, 1.3, 1] } : {}}
                                transition={{ duration: 0.5, repeat: Infinity }}
                            />
                        ))}
                    </div>

                    {/* Subtle message */}
                    <p className="text-xs text-slate-500 mt-6">
                        Creando tu rutina personalizada...
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
