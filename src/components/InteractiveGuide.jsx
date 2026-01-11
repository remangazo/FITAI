import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, X, ArrowUp, ArrowDown } from 'lucide-react';

const STEPS = [
    {
        id: 'welcome',
        title: '¡Bienvenido!',
        content: 'Tu camino al alto rendimiento empieza aquí. Déjanos guiarte.',
        selector: null,
    },
    {
        id: 'workout',
        title: 'Tu Entrenamiento',
        content: 'Aquí tienes tu rutina activa. Pulsa para iniciar tu sesión del día.',
        selector: 'guide-workout',
    },
    {
        id: 'ia-insights',
        title: 'IA Coach',
        content: 'Tu análisis personalizado. Consejos de IA basados en tu rendimiento real.',
        selector: 'guide-ia-coach',
    },
    {
        id: 'routines',
        title: 'Mis Rutinas',
        content: 'Gestiona tus planes de entrenamiento y crea nuevos con IA.',
        selector: 'guide-routines',
    },
    {
        id: 'nutrition',
        title: 'Nutrición',
        content: 'Monitorea tus calorías y macros diarios para maximizar resultados.',
        selector: 'guide-nutrition',
    },
    {
        id: 'progress',
        title: 'Evolución de Peso',
        content: 'Sigue tus cambios físicos con datos reales y gráficos inteligentes.',
        selector: 'guide-progress',
    }
];

export default function InteractiveGuide({ onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [spotlightRect, setSpotlightRect] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
    const [positionType, setPositionType] = useState('center'); // 'top', 'bottom', 'center'

    const observerRef = useRef(null);
    const retryTimeoutRef = useRef(null);

    const updatePosition = useCallback(() => {
        const step = STEPS[currentStep];
        if (!step.selector) {
            setSpotlightRect(null);
            setTooltipPos({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
            setPositionType('center');
            return;
        }

        const element = document.getElementById(step.selector);
        if (element) {
            const rect = element.getBoundingClientRect();

            // Si el elemento no tiene dimensiones, reintentar en breve
            if (rect.width === 0 || rect.height === 0) {
                retryTimeoutRef.current = setTimeout(updatePosition, 100);
                return;
            }

            setSpotlightRect({
                top: rect.top - 12,
                left: rect.left - 12,
                width: rect.width + 24,
                height: rect.height + 24,
                borderRadius: 24
            });

            // LOGICA MEJORADA DE POSICIONAMIENTO
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const isMobile = windowWidth < 768;

            if (isMobile) {
                // EN MOVIL: Siempre centrado horizontalmente
                // Intentar ponerlo abajo o arriba del spotlight, pero si no cabe, centrar en pantalla
                const spaceBelow = windowHeight - (rect.bottom + 24);
                const spaceAbove = rect.top - 24;

                if (spaceBelow > 300) {
                    setTooltipPos({
                        top: `${rect.bottom + 30}px`,
                        left: '50%',
                        transform: 'translate(-50%, 0)'
                    });
                    setPositionType('bottom');
                } else if (spaceAbove > 300) {
                    setTooltipPos({
                        bottom: `${windowHeight - rect.top + 30}px`, // Usar bottom para posicionar desde abajo
                        left: '50%',
                        transform: 'translate(-50%, 0)'
                    });
                    setPositionType('top');
                } else {
                    // Fallback: Centro absoluto si no cabe bien
                    setTooltipPos({
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                    });
                    setPositionType('center');
                }
            } else {
                // DESKTOP: Lógica original manteniendo alineación
                const spotlightBottom = rect.bottom + 24;
                const spotlightTop = rect.top - 24;

                if (windowHeight - spotlightBottom > 250) {
                    setTooltipPos({
                        top: `${spotlightBottom + 20}px`,
                        left: '50%',
                        transform: 'translateX(-50%)'
                    });
                    setPositionType('bottom');
                } else {
                    setTooltipPos({
                        top: `${spotlightTop - 220}px`,
                        left: '50%',
                        transform: 'translateX(-50%)'
                    });
                    setPositionType('top');
                }
            }

            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // Reintentar si el componente aún no se ha montado (async)
            retryTimeoutRef.current = setTimeout(updatePosition, 200);
        }
    }, [currentStep]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
            updatePosition();
        }, 1200);
        return () => {
            clearTimeout(timer);
            clearTimeout(retryTimeoutRef.current);
        };
    }, [updatePosition]);

    useEffect(() => {
        if (isVisible) {
            updatePosition();

            // Observar cambios de tamaño/posición globales
            observerRef.current = new ResizeObserver(updatePosition);
            observerRef.current.observe(document.body);

            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition);

            return () => {
                observerRef.current?.disconnect();
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition);
            };
        }
    }, [currentStep, isVisible, updatePosition]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setIsVisible(false);
            setTimeout(onComplete, 500);
        }
    };

    const handleSkip = () => {
        setIsVisible(false);
        setTimeout(onComplete, 500);
    };

    if (!isVisible) return null;

    const step = STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none select-none">
            {/* Overlay con ClipPath Dinámico */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] pointer-events-auto"
                style={{
                    clipPath: spotlightRect
                        ? `polygon(0% 0%, 0% 100%, ${spotlightRect.left}px 100%, ${spotlightRect.left}px ${spotlightRect.top}px, ${spotlightRect.left + spotlightRect.width}px ${spotlightRect.top}px, ${spotlightRect.left + spotlightRect.width}px ${spotlightRect.top + spotlightRect.height}px, ${spotlightRect.left}px ${spotlightRect.top + spotlightRect.height}px, ${spotlightRect.left}px 100%, 100% 100%, 100% 0%)`
                        : 'none'
                }}
                onClick={handleSkip}
            />

            {/* Spotlight Border & Glow */}
            <AnimatePresence>
                {spotlightRect && (
                    <motion.div
                        layoutId="spotlight"
                        className="absolute border-2 border-blue-500/50 rounded-3xl shadow-[0_0_100px_rgba(59,130,246,0.5)]"
                        initial={false}
                        animate={{
                            top: spotlightRect.top,
                            left: spotlightRect.left,
                            width: spotlightRect.width,
                            height: spotlightRect.height,
                            opacity: 1
                        }}
                    >
                        <div className="absolute inset-0 rounded-3xl animate-pulse ring-4 ring-blue-500/20" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Persistent Skip Button (Bottom Left) */}
            <div className="fixed bottom-6 left-6 z-[110] pointer-events-auto">
                <button
                    onClick={handleSkip}
                    className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                    SALTAR TUTORIAL
                </button>
            </div>

            {/* Tooltip Card - Responsive Positioning */}
            <motion.div
                key={currentStep}
                style={tooltipPos}
                initial={{ opacity: 0, y: positionType === 'top' ? -20 : 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute w-[calc(100vw-32px)] max-w-[320px] bg-slate-900 border border-white/10 p-6 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto"
            >
                {/* Indicador de dirección (Desktop Only) */}
                {positionType !== 'center' && (
                    <div className={`absolute left-1/2 -translate-x-1/2 ${positionType === 'bottom' ? '-top-3' : '-bottom-3'} text-slate-900 hidden md:block`}>
                        {positionType === 'bottom' ? <ArrowUp fill="currentColor" size={24} /> : <ArrowDown fill="currentColor" size={24} />}
                    </div>
                )}

                <div className="flex items-start gap-4 mb-4">
                    <div className="p-2.5 bg-blue-500/20 rounded-2xl text-blue-400 shrink-0">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-white mb-1">{step.title}</h3>
                        <div className="flex gap-1.5 mt-2">
                            {STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-700'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed mb-6 pl-1">{step.content}</p>

                <button
                    onClick={handleNext}
                    className="w-full bg-white text-slate-950 hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.98] px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-white/5"
                >
                    {currentStep === STEPS.length - 1 ? 'EMPEZAR VIAJE 🚀' : 'SIGUIENTE'}
                    {currentStep < STEPS.length - 1 && <ChevronRight size={16} />}
                </button>
            </motion.div>
        </div>
    );
}
