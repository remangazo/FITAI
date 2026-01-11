// Active Workout - Premium workout logging component
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Play, Pause, Check, ChevronDown, ChevronUp, ChevronRight,
    Trophy, Timer, Dumbbell, Plus, Minus, Save,
    AlertCircle, CheckCircle, Clock, Target, Info, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    startWorkout,
    getWorkout,
    logSet,
    completeWorkout,
    abandonWorkout,
    getInProgressWorkout
} from '../services/workoutService';
import { markDayAsCompleted, getRoutineProgress, isDayCompletedThisWeek } from '../services/routineTrackingService';
import { getBestExerciseImage } from '../services/exerciseImageService';
import { calculateSmartWeightSync } from '../services/weightSuggestionService';

export default function ActiveWorkout({ routine, onClose, onComplete }) {
    const { user, profile } = useAuth();
    const [workoutId, setWorkoutId] = useState(null);
    const [workout, setWorkout] = useState(null);
    const [selectedDay, setSelectedDay] = useState(0);
    const [currentExercise, setCurrentExercise] = useState(0);
    const [loading, setLoading] = useState(false); // FIXED: Start false to avoid block
    const [saving, setSaving] = useState(false);
    const [showDaySelector, setShowDaySelector] = useState(true);
    const [restTimer, setRestTimer] = useState(null);
    const [restSeconds, setRestSeconds] = useState(90);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [newPRs, setNewPRs] = useState([]);
    const [pendingWorkout, setPendingWorkout] = useState(null); // In-progress workout from previous session
    const [routineProgress, setRoutineProgress] = useState(null); // Weekly progress tracking

    // Debug mount
    useEffect(() => {
        console.log('[ActiveWorkout] Mounted with routine:', routine);
    }, []);

    // Start workout timer
    useEffect(() => {
        if (!workoutId) return;

        const interval = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [workoutId]);

    // Rest timer countdown
    useEffect(() => {
        if (restTimer === null || restTimer <= 0) return;

        const interval = setInterval(() => {
            setRestTimer(prev => {
                if (prev <= 1) {
                    // Play notification sound
                    try {
                        const audio = new Audio('/notification.mp3');
                        audio.play().catch(() => { });
                    } catch (e) { }
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [restTimer]);

    // Auto-dismiss PR celebration after 4 seconds
    useEffect(() => {
        if (newPRs.length === 0) return;

        const timer = setTimeout(() => {
            setNewPRs([]);
        }, 4000);

        return () => clearTimeout(timer);
    }, [newPRs]);

    // Handle Android/Browser back button to close modal
    useEffect(() => {
        if (showDaySelector || workoutId) {
            // Push a dummy state to history
            window.history.pushState({ modalOpen: true }, '');

            const handlePopState = (e) => {
                // If the user goes back, close the modal
                onClose?.();
            };

            window.addEventListener('popstate', handlePopState);
            return () => window.removeEventListener('popstate', handlePopState);
        }
    }, [showDaySelector, workoutId]);

    // Check for existing workout on mount or when routine changes
    useEffect(() => {
        // BYPASS: Temporarily disabled to prevent black screen block
        /*
        if (user && routine?.id) {
            checkExistingWorkout();
        } else if (user && !routine?.id) {
            console.warn('[ActiveWorkout] Missing routine.id, progress tracking may be disabled');
            setLoading(false);
        }
        */
        if (user && routine?.id) {
            console.log("Checking progress asynchronously...");
            checkExistingWorkout();
        }
    }, [user?.uid, routine?.id]);

    // Safety timeout for loading state
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.warn('[ActiveWorkout] Loading timeout - forcing render');
                setLoading(false);
            }
        }, 5000);
        return () => clearTimeout(timer);
    }, [loading]);

    // Check for existing workout progress
    const checkExistingWorkout = async () => {
        if (!user || !routine?.id) {
            // setLoading(false); 
            return;
        }

        try {
            console.log('[ActiveWorkout] Checking existing workout...');
            // Load routine progress first
            const progress = await getRoutineProgress(user.uid, routine.id).catch(e => {
                console.error('[ActiveWorkout] Error fetching progress:', e);
                return null;
            });
            setRoutineProgress(progress);

            // Check for in-progress workout
            const existing = await getInProgressWorkout(user.uid).catch(e => {
                console.error('[ActiveWorkout] Error fetching existing workout:', e);
                return null;
            });

            if (existing && existing.routineId === routine.id && !existing.completed) {
                console.log('[ActiveWorkout] Found existing workout:', existing);
                setPendingWorkout(existing);
            }
        } catch (error) {
            console.error('[ActiveWorkout] Error in checkExistingWorkout:', error);
        } finally {
            // setLoading(false);
        }
    };

    const handleContinueExisting = () => {
        if (!pendingWorkout) return;

        setWorkoutId(pendingWorkout.id);
        setWorkout(pendingWorkout);
        setShowDaySelector(false);

        // Calculate elapsed time
        const startTime = pendingWorkout.startTime?.toDate?.() || new Date(pendingWorkout.startTime);
        const elapsed = Math.floor((new Date() - startTime) / 1000);
        setElapsedTime(elapsed);
        setPendingWorkout(null);
    };

    const handleStartWorkout = async () => {
        if (!user || !routine) return;

        setLoading(true);
        try {
            // If there's a pending workout, abandon it first
            if (pendingWorkout) {
                await abandonWorkout(pendingWorkout.id);
                setPendingWorkout(null);
            }

            const id = await startWorkout(user.uid, routine, selectedDay);
            const workoutData = await getWorkout(id);
            setWorkoutId(id);
            setWorkout(workoutData);
            setShowDaySelector(false);
            setElapsedTime(0); // Reset timer for new workout
        } catch (error) {
            console.error('[ActiveWorkout] Error starting:', error);
            alert('Error al iniciar entrenamiento');
        } finally {
            setLoading(false);
        }
    };

    const handleLogSet = async (exerciseIndex, setData) => {
        if (!workoutId) return;

        setSaving(true);
        try {
            const result = await logSet(workoutId, exerciseIndex, setData);

            // Refresh workout data
            const updated = await getWorkout(workoutId);
            setWorkout(updated);

            // Check for PR
            if (result.isPR && !newPRs.includes(updated.exercises[exerciseIndex].name)) {
                setNewPRs(prev => [...prev, updated.exercises[exerciseIndex].name]);
            }

            // Start rest timer
            setRestTimer(restSeconds);
        } catch (error) {
            console.error('[ActiveWorkout] Error logging set:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCompleteWorkout = async () => {
        if (!workoutId) return;

        setSaving(true);
        try {
            const summary = await completeWorkout(workoutId);

            // Mark day as completed in routine tracking
            if (user && routine && workout) {
                await markDayAsCompleted(
                    user.uid,
                    routine.id,
                    workout.dayIndex,
                    workout.dayName
                );
                console.log('[ActiveWorkout] Day marked as completed');
            }

            onComplete?.(summary);
        } catch (error) {
            console.error('[ActiveWorkout] Error completing:', error);
            alert('Error al finalizar entrenamiento');
        } finally {
            setSaving(false);
        }
    };

    const handleAbandonWorkout = async () => {
        if (!workoutId) return;
        if (!confirm('¿Abandonar este entrenamiento? Se perderá el progreso no guardado.')) return;

        try {
            await abandonWorkout(workoutId);
            onClose?.();
        } catch (error) {
            console.error('[ActiveWorkout] Error abandoning:', error);
        }
    };



    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!routine) {
        return (
            <div className="fixed inset-0 bg-slate-950 z-[60] flex items-center justify-center text-white">
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-sm text-center">
                    <h3 className="text-red-400 font-bold mb-2">Error de Rutina</h3>
                    <p className="text-slate-400 text-sm mb-4">No se pudo cargar la información de la rutina.</p>
                    <button onClick={onClose} className="px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700 transition-colors">Cerrar</button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-950 z-[60] flex items-center justify-center text-white">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-slate-200 font-medium">Cargando entrenamiento...</p>
                </div>
            </div>
        );
    }

    // Day Selector
    if (showDaySelector) {
        return (
            <div className="fixed inset-0 bg-slate-950 z-[60] overflow-y-auto text-white">
                <div className="max-w-2xl mx-auto p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-2xl font-bold">Iniciar Entrenamiento</h1>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Pending Workout Alert */}
                    {pendingWorkout && (
                        <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="text-orange-400 flex-shrink-0 mt-0.5" size={20} />
                                <div className="flex-1">
                                    <h3 className="font-bold text-orange-400 mb-1">
                                        Entrenamiento sin terminar
                                    </h3>
                                    <p className="text-sm text-slate-400 mb-3">
                                        Tienes un entrenamiento de "{pendingWorkout.dayName}" que no completaste.
                                        Ya tienes {pendingWorkout.totalSets || 0} series registradas.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleContinueExisting}
                                            className="flex-1 bg-orange-500 hover:bg-orange-400 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                        >
                                            <Play size={16} />
                                            Continuar
                                        </button>
                                        <button
                                            onClick={() => {
                                                abandonWorkout(pendingWorkout.id);
                                                setPendingWorkout(null);
                                            }}
                                            className="px-4 bg-slate-700 hover:bg-slate-600 py-2 rounded-xl font-bold text-sm"
                                        >
                                            Descartar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <p className="text-slate-400 mb-6">Selecciona el día que vas a entrenar:</p>

                    <div className="space-y-4">
                        {Array.isArray(routine?.days) ? routine.days.map((day, index) => {
                            let isCompleted = false;
                            try {
                                isCompleted = routineProgress && isDayCompletedThisWeek(routineProgress.completedDays || [], index);
                            } catch (err) {
                                console.warn(`[ActiveWorkout] Error checking completion for day ${index}:`, err);
                            }

                            const isSelected = selectedDay === index;

                            // Safety fallbacks
                            const dayName = day?.day || `Día ${index + 1}`;
                            const dayFocus = day?.focus || 'Entrenamiento General';
                            const exerciseCount = day?.exercises?.length || 0;
                            const duration = '~45 MIN'; // Could be dynamic if we had durations

                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDay(index)}
                                    className={`w-full p-5 rounded-[32px] border-2 text-left transition-all relative overflow-hidden group ${isSelected
                                        ? 'border-indigo-500 bg-indigo-500/10 ring-4 ring-indigo-500/10'
                                        : isCompleted
                                            ? 'border-emerald-500/30 bg-emerald-500/[0.03]'
                                            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                                        }`}
                                >
                                    {isCompleted && (
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-[40px] pointer-events-none" />
                                    )}

                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <h3 className={`font-black text-lg ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                                        {dayName}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{dayFocus}</span>
                                                        {isCompleted && (
                                                            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 uppercase tracking-tighter bg-emerald-400/10 px-2 py-0.5 rounded-full">
                                                                <Check size={10} strokeWidth={4} />
                                                                LISTO
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            {isCompleted ? (
                                                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                                    <Check size={20} strokeWidth={3} />
                                                </div>
                                            ) : isSelected ? (
                                                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                                    <Play size={20} fill="currentColor" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full border-2 border-white/5 flex items-center justify-center text-slate-600 group-hover:border-white/20 transition-colors">
                                                    <ChevronRight size={20} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                                        <span className="flex items-center gap-1">
                                            <Dumbbell size={10} />
                                            {exerciseCount} EJERCICIOS
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Timer size={10} />
                                            {duration}
                                        </span>
                                    </div>
                                </button>
                            );
                        }) : (
                            <div className="p-4 text-center text-slate-500">
                                No hay días configurados en esta rutina.
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleStartWorkout}
                        className="w-full mt-8 bg-gradient-to-r from-indigo-600 to-violet-600 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:from-indigo-500 hover:to-violet-500 transition-all text-white"
                    >
                        <Play size={20} />
                        {pendingWorkout ? 'Comenzar Nuevo' : 'Comenzar'} {routine.days?.[selectedDay]?.day || 'Entrenamiento'}
                    </button>
                </div>
            </div>
        );
    }


    // Main Workout UI
    return (
        <div className="fixed inset-0 bg-slate-950 z-[60] flex flex-col text-white">
            {/* Header with timer */}
            <header className="bg-slate-900 border-b border-white/10 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-lg">{workout?.dayName}</h1>
                        <p className="text-sm text-slate-400">{workout?.dayFocus}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-2xl font-mono font-bold text-blue-400">
                                {formatTime(elapsedTime)}
                            </div>
                            <div className="text-xs text-slate-500">Duración</div>
                        </div>
                        <button
                            onClick={handleAbandonWorkout}
                            className="p-2 hover:bg-white/5 rounded-xl text-slate-400"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Progreso</span>
                        <span>{workout?.totalSets || 0} series completadas</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                            initial={{ width: 0 }}
                            animate={{
                                width: `${Math.min(100, ((workout?.totalSets || 0) /
                                    (workout?.exercises?.reduce((sum, ex) => sum + ex.targetSets, 0) || 1)) * 100)}%`
                            }}
                        />
                    </div>
                </div>
            </header>

            {/* Rest Timer Overlay */}
            <AnimatePresence>
                {restTimer !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-24 left-0 right-0 mx-4 bg-indigo-600 rounded-2xl p-4 z-10 shadow-lg shadow-indigo-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Timer className="animate-pulse" size={24} />
                                <div>
                                    <div className="text-xs opacity-80">Descanso</div>
                                    <div className="text-2xl font-mono font-bold">{restTimer}s</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setRestTimer(null)}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm"
                            >
                                Saltar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PR Celebration */}
            <AnimatePresence>
                {newPRs.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-24 left-0 right-0 mx-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-4 z-20"
                    >
                        <div className="flex items-center gap-3">
                            <Trophy size={32} />
                            <div>
                                <div className="font-bold">¡NUEVO RÉCORD PERSONAL!</div>
                                <div className="text-sm opacity-90">{newPRs[newPRs.length - 1]}</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Exercise List */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {workout?.exercises?.map((exercise, exIndex) => (
                    <ExerciseLogger
                        key={exIndex}
                        exercise={exercise}
                        exerciseIndex={exIndex}
                        isActive={currentExercise === exIndex}
                        onActivate={() => setCurrentExercise(exIndex)}
                        onLogSet={(setData) => handleLogSet(exIndex, setData)}
                        saving={saving}
                        userProfile={profile}
                    />
                ))}
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 border-t border-white/10 p-4">
                <div className="flex gap-3">
                    <div className="flex-1 bg-slate-800 rounded-2xl p-3">
                        <div className="text-xs text-slate-500">Volumen Total</div>
                        <div className="text-xl font-bold">
                            {((workout?.totalVolume || 0) / 1000).toFixed(1)}k kg
                        </div>
                    </div>
                    <button
                        onClick={handleCompleteWorkout}
                        disabled={saving || (workout?.totalSets || 0) === 0}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Check size={20} />
                        Finalizar
                    </button>
                </div>
            </footer>
        </div>
    );
}

// Exercise Logger Component
function ExerciseLogger({ exercise, exerciseIndex, isActive, onActivate, onLogSet, saving, userProfile }) {
    const [expanded, setExpanded] = useState(isActive);

    // Calculate smart weight based on user profile, benchmarks, and exercise
    const smartWeight = calculateSmartWeightSync(exercise, userProfile);
    const defaultWeight = exercise.suggestedWeight
        ? (typeof exercise.suggestedWeight === 'string'
            ? parseFloat(exercise.suggestedWeight)
            : exercise.suggestedWeight)
        : smartWeight.weight;

    const [currentWeight, setCurrentWeight] = useState(defaultWeight || 20);
    const [currentReps, setCurrentReps] = useState(10);

    // Determine if weight is per dumbbell
    const isPerDumbbell = smartWeight.perDumbbell;

    useEffect(() => {
        setExpanded(isActive);
    }, [isActive]);

    const completedSets = exercise.sets?.length || 0;
    const targetSets = exercise.targetSets || 4;
    const isComplete = completedSets >= targetSets;

    const handleLogCurrentSet = () => {
        onLogSet({
            weight: currentWeight,
            reps: currentReps,
            completed: true
        });
    };

    const adjustWeight = (delta) => {
        setCurrentWeight(prev => Math.max(0, prev + delta));
    };

    const adjustReps = (delta) => {
        setCurrentReps(prev => Math.max(0, prev + delta));
    };

    return (
        <motion.div
            layout
            className={`glass rounded-2xl border overflow-hidden ${isComplete
                ? 'border-green-500/30 bg-green-500/5'
                : exercise.personalRecord
                    ? 'border-yellow-500/30 bg-yellow-500/5'
                    : 'border-white/10'
                }`}
        >
            <button
                onClick={() => {
                    setExpanded(!expanded);
                    onActivate();
                }}
                className="w-full p-4 flex items-center justify-between text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border border-white/5 ${isComplete ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800'}`}>
                            <img
                                src={getBestExerciseImage(exercise.name)}
                                alt={exercise.name}
                                className="w-full h-full object-cover opacity-70"
                            />
                            {!isComplete && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <Dumbbell size={16} className="text-white/60" />
                                </div>
                            )}
                        </div>
                        {isComplete && (
                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-zinc-900">
                                <Check size={10} className="text-white" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold">{exercise.name}</h3>
                            {exercise.personalRecord && (
                                <Trophy size={14} className="text-yellow-500" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-400">
                                {completedSets}/{targetSets} series • {exercise.targetReps} reps
                            </p>
                            {exercise.machineName && (
                                <span className="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Settings size={8} /> {exercise.machineName}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10"
                    >
                        <div className="p-4 space-y-4">
                            {/* Previous sets */}
                            {exercise.sets && exercise.sets.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-xs text-slate-500 font-bold uppercase">
                                        Series Completadas
                                    </div>
                                    {exercise.sets.map((set, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded-xl"
                                        >
                                            <span className="text-slate-400">Serie {i + 1}</span>
                                            <span className="font-mono font-bold">
                                                {set.weight}kg × {set.reps}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Variation Tip */}
                            {exercise.variation && (
                                <div className="mb-4 text-xs text-purple-400 font-medium flex items-center gap-2 bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
                                    <Info size={16} />
                                    <span>Tip: {exercise.variation}</span>
                                </div>
                            )}

                            {/* New set input */}
                            {!isComplete && (
                                <div className="bg-slate-800/50 rounded-2xl p-4">
                                    <div className="text-xs text-slate-500 font-bold uppercase mb-3">
                                        Serie {completedSets + 1}
                                        {defaultWeight && (
                                            <span className="text-blue-400 ml-2 normal-case font-normal">
                                                (Sugerido: {defaultWeight}kg{isPerDumbbell ? ' c/u' : ''} • basado en {smartWeight.source || 'tu perfil'})
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                        {/* Weight input */}
                                        <div className="bg-slate-700/30 p-2 rounded-xl border border-white/5">
                                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1 px-1">
                                                Peso (kg){isPerDumbbell ? ' c/mancuerna' : ''}
                                            </label>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => adjustWeight(-2.5)}
                                                    className="w-10 h-10 bg-slate-700 hover:bg-slate-600 active:scale-95 rounded-lg flex items-center justify-center transition-all"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <input
                                                    type="number"
                                                    value={currentWeight}
                                                    onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)}
                                                    className="flex-1 min-w-0 bg-transparent text-center text-xl font-bold py-1 focus:outline-none"
                                                />
                                                <button
                                                    onClick={() => adjustWeight(2.5)}
                                                    className="w-10 h-10 bg-slate-700 hover:bg-slate-600 active:scale-95 rounded-lg flex items-center justify-center transition-all"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Reps input */}
                                        <div className="bg-slate-700/30 p-2 rounded-xl border border-white/5">
                                            <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1 px-1">
                                                Repeticiones
                                            </label>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => adjustReps(-1)}
                                                    className="w-10 h-10 bg-slate-700 hover:bg-slate-600 active:scale-95 rounded-lg flex items-center justify-center transition-all"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <input
                                                    type="number"
                                                    value={currentReps}
                                                    onChange={(e) => setCurrentReps(parseInt(e.target.value) || 0)}
                                                    className="flex-1 min-w-0 bg-transparent text-center text-xl font-bold py-1 focus:outline-none"
                                                />
                                                <button
                                                    onClick={() => adjustReps(1)}
                                                    className="w-10 h-10 bg-slate-700 hover:bg-slate-600 active:scale-95 rounded-lg flex items-center justify-center transition-all"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleLogCurrentSet}
                                        disabled={saving}
                                        className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                                        ) : (
                                            <>
                                                <Check size={18} />
                                                Registrar Serie
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Completed badge */}
                            {isComplete && (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-2 text-green-400">
                                    <CheckCircle size={20} />
                                    <span className="font-bold">Ejercicio completado</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
