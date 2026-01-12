import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, TrendingUp, TrendingDown, AlertTriangle,
    ChevronRight, ChevronDown, RefreshCw, Target, Dumbbell,
    Award, Zap, Heart, Flame, Clock, Play, Calendar,
    Sparkles, ArrowUp, ArrowDown, Check, Info
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import { analyzeProgressWithAI, generateLocalAnalysis } from '../services/openrouterService';
import {
    getWorkoutHistory,
    getWeeklyStats,
    getAllPersonalRecords,
    getExerciseProgress
} from '../services/workoutService';
import { getActiveRoutine } from '../services/routineService';
import { getWeeklyActivities } from '../services/nutritionService';
import { useNavigate } from 'react-router-dom';

const ActivityRings = ({ score = 0, workouts = 0, goals = 4, cardioProgress = 0 }) => {
    const safeScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
    const safeWorkouts = Math.max(0, Number(workouts) || 0);
    const safeGoals = Math.max(1, Number(goals) || 4);
    const safeCardio = Math.max(0, Math.min(100, Math.round(Number(cardioProgress) || 0)));
    const workoutProgress = Math.min(100, (safeWorkouts / safeGoals) * 100);

    // Radius and Circumference
    const r1 = 70;
    const c1 = 2 * Math.PI * r1;
    const r2 = 54;
    const c2 = 2 * Math.PI * r2;
    const r3 = 38;
    const c3 = 2 * Math.PI * r3;

    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
                {/* Background Rings */}
                <circle cx="96" cy="96" r={r1} stroke="rgba(255,255,255,0.03)" strokeWidth="12" fill="none" />
                <circle cx="96" cy="96" r={r2} stroke="rgba(255,255,255,0.03)" strokeWidth="10" fill="none" />
                <circle cx="96" cy="96" r={r3} stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="none" />

                {/* Progress Score Ring */}
                <motion.circle
                    cx="96" cy="96" r={r1}
                    stroke="url(#scoreGradient)" strokeWidth="12" fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: c1, strokeDashoffset: c1 }}
                    animate={{ strokeDashoffset: c1 - (c1 * safeScore / 100) }}
                    transition={{ duration: 2, ease: "easeOut" }}
                />

                {/* Weekly Sessions Ring */}
                <motion.circle
                    cx="96" cy="96" r={r2}
                    stroke="url(#workoutGradient)" strokeWidth="10" fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: c2, strokeDashoffset: c2 }}
                    animate={{ strokeDashoffset: c2 - (c2 * Math.min(100, workoutProgress) / 100) }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                />

                {/* Cardio Progress Ring */}
                <motion.circle
                    cx="96" cy="96" r={r3}
                    stroke="url(#cardioGradient)" strokeWidth="8" fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: c3, strokeDashoffset: c3 }}
                    animate={{ strokeDashoffset: c3 - (c3 * safeCardio / 100) }}
                    transition={{ duration: 1.2, delay: 1, ease: "easeOut" }}
                />

                <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    <linearGradient id="workoutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                    <linearGradient id="cardioGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-4xl font-black text-white"
                >
                    {Math.round(safeScore)}
                </motion.span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score</span>
            </div>
        </div>
    );
};

// Premium UI Components for AICoach
const ScoreExplanationModal = ({ onClose }) => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
    >
        <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md p-8 rounded-[40px] bg-slate-900 border border-white/10 shadow-2xl shadow-indigo-500/10"
            onClick={e => e.stopPropagation()}
        >
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-black flex items-center gap-3">
                    <Brain className="text-indigo-400" /> Puntaje de Progreso
                </h3>
            </div>
            <div className="space-y-6">
                <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">¿Qué mide este número?</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        Es un indicador dinámico de tu <span className="text-indigo-400 font-bold">consistencia y rendimiento</span>. La IA de Elite Coach analiza:
                    </p>
                    <ul className="mt-4 space-y-3">
                        <li className="flex items-start gap-3 text-xs text-slate-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                            <span><strong className="text-white">Adherencia</strong>: Cumplimiento de tus días de entreno.</span>
                        </li>
                        <li className="flex items-start gap-3 text-xs text-slate-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                            <span><strong className="text-white">Intensidad</strong>: Volumen total y récords personales (PRs).</span>
                        </li>
                        <li className="flex items-start gap-3 text-xs text-slate-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                            <span><strong className="text-white">Actividad</strong>: Cardio y pasos extra registrados.</span>
                        </li>
                    </ul>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Código de Colores</h4>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                            <span className="text-[10px] text-slate-300 font-bold">ANILLO EXTERIOR: PUNTAJE GLOBAL</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-[10px] text-slate-300 font-bold">ANILLO MEDIO: SESIONES SEMANALES</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <span className="text-[10px] text-slate-300 font-bold">ANILLO INTERIOR: CALORÍAS DE CARDIO (RECOMENDADO SEGÚN PESO)</span>
                        </div>
                    </div>
                </div>
            </div>
            <button
                onClick={onClose}
                className="w-full mt-8 py-4 rounded-2xl bg-white text-slate-950 font-black text-sm hover:bg-slate-100 transition-colors"
            >
                ENTENDIDO
            </button>
        </motion.div>
    </motion.div>
);

const StrengthChart = ({ data, title }) => {
    if (!data || data.length < 2) return null;

    const chartData = data.map(d => {
        const dateObj = d.date?.toDate ? d.date.toDate() : new Date(d.date);
        return {
            date: dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
            weight: d.maxWeight
        };
    });

    return (
        <div className="p-6 rounded-[32px] bg-slate-900/50 border border-white/5 backdrop-blur-sm">
            <h4 className="font-black text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-400" /> Progresión: {title}
            </h4>
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis
                            dataKey="date"
                            hide
                        />
                        <YAxis
                            hide
                            domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                fontSize: '10px',
                                fontWeight: 'bold'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="weight"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorWeight)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Historial de Carga</span>
                <span className="text-xs font-black text-emerald-400">+{Math.round(((chartData[chartData.length - 1].weight - chartData[0].weight) / chartData[0].weight) * 100)}%</span>
            </div>
        </div>
    );
};

const InsightCard = ({ icon: Icon, title, items, color = "indigo" }) => {
    const themes = {
        indigo: "from-indigo-500/10 to-transparent border-indigo-500/20",
        emerald: "from-emerald-500/10 to-transparent border-emerald-500/20",
        amber: "from-amber-500/10 to-transparent border-amber-500/20"
    };

    const textColors = {
        indigo: "text-indigo-400",
        emerald: "text-emerald-400",
        amber: "text-amber-400"
    };

    return (
        <div className={`p-8 rounded-[40px] border bg-gradient-to-b ${themes[color]} backdrop-blur-md h-full flex flex-col`}>
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-slate-950/50 border border-white/5 shadow-inner">
                    <Icon size={20} className={textColors[color]} />
                </div>
                <h4 className="font-black text-sm text-white uppercase tracking-widest">{title}</h4>
            </div>
            <ul className="space-y-4 flex-1">
                {Array.isArray(items) ? items.map((item, i) => (
                    <li key={i} className="text-sm text-slate-300 font-medium flex items-start gap-4 leading-snug">
                        <span className={`w-1.5 h-1.5 rounded-full bg-${color}-500 mt-2 flex-shrink-0 shadow-[0_0_8px] shadow-${color}-500/50`} />
                        {item}
                    </li>
                )) : (
                    <li className="text-xs text-slate-500 italic">
                        {typeof items === 'string' ? items : 'Sin datos disponibles'}
                    </li>
                )}
            </ul>
        </div>
    );
};

const AICoachCard = React.memo(function AICoachCard({ user, profile }) {
    const navigate = useNavigate();
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [lastAnalyzed, setLastAnalyzed] = useState(null);
    const [showScoreInfo, setShowScoreInfo] = useState(false);
    const [strengthData, setStrengthData] = useState([]);

    // Load cached recommendations on mount with Smart Validation for freshness
    useEffect(() => {
        const cached = localStorage.getItem('fitai_ai_recommendations');
        const cachedTime = localStorage.getItem('fitai_ai_recommendations_time');
        const cachedMeta = localStorage.getItem('fitai_ai_recommendations_meta');

        if (cached && cachedTime) {
            const parsed = JSON.parse(cached);

            // 1. Force refresh if fallback
            if (parsed.isFallback) return;

            // 2. Smart Validation logic moved to analyzeProgress or skipped here to prevent crash


            // 3. Expiry check (Reduced to 6 hours for variety)
            const hoursSince = (Date.now() - parseInt(cachedTime)) / (1000 * 60 * 60);
            if (hoursSince < 6) {
                setRecommendations(parsed);
                setLastAnalyzed(new Date(parseInt(cachedTime)));
            }
        }
    }, [user?.uid]);

    const handleRefresh = () => {
        // Clear cache and force re-analysis
        localStorage.removeItem('fitai_ai_recommendations');
        localStorage.removeItem('fitai_ai_recommendations_time');
        setRecommendations(null);
        analyzeProgress(true);
    };

    const analyzeProgress = async (force = false) => {
        if (!user || loading) return;
        setLoading(true);

        let stats = {}, recentWorkouts = [], personalRecords = {}, activeRoutine = null, extraActivities = [];
        let workoutCount = 0;

        try {
            console.log('[AICoach] Starting analysis for user:', user.uid);

            const results = await Promise.all([
                getWeeklyStats(user.uid),
                getWorkoutHistory(user.uid, 10),
                getAllPersonalRecords(user.uid),
                getActiveRoutine(user.uid),
                getWeeklyActivities(user.uid)
            ]);

            stats = results[0] || {};
            recentWorkouts = results[1] || [];
            personalRecords = results[2] || {};
            activeRoutine = results[3] || null;
            extraActivities = results[4] || [];
            workoutCount = recentWorkouts.length;

            // Smart Cache Check inside function (double check before API call if not forced)
            if (!force) {
                const cached = localStorage.getItem('fitai_ai_recommendations');
                const cachedTime = localStorage.getItem('fitai_ai_recommendations_time');
                const cachedMeta = localStorage.getItem('fitai_ai_recommendations_meta');

                // If we have cached results and workout count matches, use it to save API calls
                // But if we have MORE workouts now than in meta, we proceed to API.
                if (cached && cachedMeta) {
                    const meta = JSON.parse(cachedMeta);
                    const recentCount = recentWorkouts.length;

                    if (meta.workoutCount === recentCount) {
                        // Data hasn't changed, reuse cache if not expired
                        const hoursSince = (Date.now() - parseInt(cachedTime)) / (1000 * 60 * 60);
                        if (hoursSince < 6) {
                            console.log('[AICoach] Smart Cache: Data identical, reusing cache.');
                            setRecommendations(JSON.parse(cached));
                            setLastAnalyzed(new Date(parseInt(cachedTime)));
                            setLoading(false);
                            return;
                        }
                    }
                }
            }

            console.log('[AICoach] Data collected:', {
                stats,
                workoutCount: recentWorkouts?.length || 0,
                prCount: Object.keys(personalRecords || {}).length,
                hasRoutine: !!activeRoutine,
                extraCount: extraActivities?.length || 0
            });

            workoutCount = recentWorkouts?.length || 0;

            console.log('[AICoach] Calling AI API...');
            const aiPromise = analyzeProgressWithAI({
                weeklyStats: stats,
                recentWorkouts,
                personalRecords,
                userProfile: profile,
                activeRoutine,
                extraActivities
            });

            const result = await Promise.race([
                aiPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 25000))
            ]);

            console.log('[AICoach] AI Result received:', result);

            // Enrich result
            result.streak = stats?.streak || 0;
            result.totalWorkouts = workoutCount;
            result.weeklyWorkouts = stats?.workoutsThisWeek || 0;
            result.extraActivities = extraActivities?.length || 0;
            result.personalRecordsCount = Object.keys(personalRecords || {}).length;

            if (result.weeklyGoals && typeof result.weeklyGoals[0] === 'string') {
                result.weeklyGoals = result.weeklyGoals.map(g => ({
                    text: g,
                    completed: stats?.workoutsThisWeek >= 3 && g.toLowerCase().includes('entren')
                }));
            } else if (!result.weeklyGoals || result.weeklyGoals.length === 0) {
                // GENERATE DYNAMIC MISSIONS (NEW)
                const prList = Object.keys(personalRecords || {});
                const hasWorkouts = stats?.workoutsThisWeek > 0;

                result.weeklyGoals = [
                    {
                        text: stats?.workoutsThisWeek < (profile?.trainingFrequency || 3)
                            ? `Entrenar ${profile?.trainingFrequency || 3} días esta semana`
                            : "¡Objetivo de frecuencia cumplido!",
                        completed: stats?.workoutsThisWeek >= (profile?.trainingFrequency || 3)
                    },
                    {
                        text: prList.length > 0
                            ? `Superar PR en ${prList[Math.floor(Math.random() * prList.length)]}`
                            : "Establecer tu primer Récord Personal (PR)",
                        completed: false
                    },
                    {
                        text: "Registrar entrenamientos para mejorar mi IA",
                        completed: stats?.workoutsThisWeek > 0
                    }
                ];
            }

            console.log('[AICoach] Enriched result:', result);
            setRecommendations(result);
            setLastAnalyzed(new Date());

            if (!result.isFallback) {
                localStorage.setItem('fitai_ai_recommendations', JSON.stringify(result));
                localStorage.setItem('fitai_ai_recommendations_time', Date.now().toString());
                // Save meta data for smart invalidation
                localStorage.setItem('fitai_ai_recommendations_meta', JSON.stringify({
                    workoutCount: workoutCount,
                    date: new Date().toISOString()
                }));
                console.log('[AICoach] Result cached to localStorage with Smart Meta');
            } else {
                console.warn('[AICoach] Fallback result not cached');
            }

            // Fetch strength history for key exercises
            if (workoutCount > 0) {
                // Prioritize PRs, but fallback to any exercise with history
                let exercisesToChart = Object.keys(personalRecords || {}).slice(0, 2);

                if (exercisesToChart.length < 2) {
                    const allExercisesInHistory = [...new Set(recentWorkouts.flatMap(w => w.exercises?.map(ex => ex.name) || []))];
                    const extra = allExercisesInHistory.filter(name => !exercisesToChart.includes(name)).slice(0, 2 - exercisesToChart.length);
                    exercisesToChart = [...exercisesToChart, ...extra];
                }

                const historyPromises = exercisesToChart.map(name => getExerciseProgress(user.uid, name));
                const histories = await Promise.all(historyPromises);
                const combinedData = exercisesToChart.map((name, i) => ({
                    title: name,
                    history: histories[i]
                })).filter(d => d.history.length >= 2);
                setStrengthData(combinedData);
            }
        } catch (error) {
            console.error('[AICoach] Analysis error:', error);

            try {
                // FALLBACK DE SEGUNDO NIVEL: Si falla el análisis, forzar uno local ultra-básico
                if (!recommendations) {
                    console.warn('[AICoach] Emergency fallback activated');
                    const ultraStats = stats || { workoutsThisWeek: 0 };
                    const ultraProfile = profile || { trainingFrequency: 3 };

                    const localFallback = generateLocalAnalysis({
                        weeklyStats: ultraStats,
                        userProfile: ultraProfile,
                        activeRoutine: activeRoutine || null,
                        extraActivities: extraActivities || []
                    });

                    // Asegurar que no hay undefined en campos críticos
                    localFallback.strengths = localFallback.strengths || ["Iniciando programa"];
                    localFallback.areasToImprove = localFallback.areasToImprove || ["Completar perfil"];
                    localFallback.weeklyGoals = localFallback.weeklyGoals || [{ text: "Completar entrenamiento", completed: false }];

                    setRecommendations({
                        ...localFallback,
                        weeklyWorkouts: ultraStats.workoutsThisWeek || 0,
                        extraActivities: extraActivities?.length || 0,
                        personalRecordsCount: Object.keys(personalRecords || {}).length,
                        streak: ultraStats.streak || 0
                    });
                }
            } catch (fallbackError) {
                console.error('[AICoach] Catastrophic fallback error:', fallbackError);
                setRecommendations({
                    overallAssessment: "Optimizando tu plan...",
                    progressScore: 0,
                    weeklyWorkouts: 0,
                    extraActivities: 0,
                    personalRecordsCount: 0,
                    strengths: ["Preparando datos"],
                    areasToImprove: ["Cargando información"],
                    weeklyGoals: [],
                    streak: 0
                });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && !recommendations && !loading) {
            analyzeProgress();
        }
    }, [user?.uid]);

    if (loading && !recommendations) {
        return (
            <div className="p-8 rounded-[40px] bg-slate-950 border border-white/5 flex flex-col items-center justify-center space-y-4">
                <motion.div
                    animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500"
                />
                <p className="text-slate-400 font-medium animate-pulse">Sincronizando con tu Coach IA...</p>
            </div>
        );
    }

    if (!recommendations && !loading) {
        return (
            <div className="p-8 rounded-[40px] bg-slate-950 border border-white/5 flex flex-col items-center justify-center space-y-4">
                <button
                    onClick={() => analyzeProgress(true)}
                    className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold"
                >
                    Reintentar Conexión
                </button>
            </div>
        );
    }

    return (
        <motion.div
            layout
            className="group relative overflow-hidden rounded-[40px] bg-slate-950 border border-white/5 transition-all duration-500 hover:border-indigo-500/30"
        >
            {/* Glossy Background Effect */}
            <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-indigo-600/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-emerald-600/10 blur-[120px] pointer-events-none" />

            {/* Top Right Actions (Absolute) - Optimization per user request to save space on mobile */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8 z-30 flex items-center gap-2">
                {recommendations?.streak > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                        <Flame size={12} fill="currentColor" className="md:w-3.5 md:h-3.5" />
                        <span className="text-[10px] md:text-xs font-black">{recommendations.streak}d</span>
                    </div>
                )}
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={handleRefresh}
                    title="Analizar de nuevo"
                    className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md"
                >
                    <RefreshCw size={14} className={`md:w-[18px] md:h-[18px] ${loading ? "animate-spin" : ""}`} />
                </motion.button>
            </div>

            {/* Header Content */}
            <div className="relative z-10 p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">

                    {/* Hero Section: Progress Rings */}
                    <div className="flex-shrink-0 relative">
                        <ActivityRings
                            score={recommendations?.progressScore}
                            workouts={recommendations?.weeklyWorkouts}
                            goals={profile?.trainingFrequency || 3}
                            cardioProgress={recommendations?.cardioProgress || 0}
                        />
                        <button
                            onClick={() => setShowScoreInfo(true)}
                            className="absolute -top-1 -right-1 p-2 bg-slate-900 border border-white/10 rounded-full text-slate-500 hover:text-white transition-colors"
                        >
                            <Info size={14} />
                        </button>
                    </div>

                    {/* Meta Section */}
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                    <h2 className="text-2xl font-black text-white tracking-tight">Elite AI Coach</h2>
                                    <div className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-black text-indigo-400 uppercase tracking-tighter">
                                        PRO
                                    </div>
                                </div>
                                <p className="text-indigo-400/80 font-bold text-sm">
                                    {recommendations.activePlanSummary || "Optimizando tu progreso"}
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="text-lg md:text-xl font-medium text-slate-200 leading-tight"
                            >
                                "{recommendations.overallAssessment}"
                            </motion.div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
                            {[
                                { icon: Dumbbell, label: "Entrenos", value: recommendations.weeklyWorkouts, color: "blue" },
                                { icon: Sparkles, label: "Extra", value: recommendations.extraActivities, color: "emerald" },
                                { icon: Award, label: "Récords", value: recommendations.personalRecordsCount || 0, color: "amber" },
                                { icon: Zap, label: "Cumplimiento", value: `${Math.min(100, Math.round(((Number(recommendations.weeklyWorkouts) || 0) / (Number(profile?.trainingFrequency) || 4)) * 100))}%`, color: "indigo" }
                            ].map((stat, i) => (
                                <div key={i} className="p-3 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                                    <div className={`p-2 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400`}>
                                        <stat.icon size={16} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 font-bold">{stat.label}</div>
                                        <div className="text-sm font-black text-white">{stat.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Secondary Content: Stable Grid Layout */}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Fortalezas */}
                    <InsightCard
                        icon={TrendingUp} title="Fortalezas"
                        items={recommendations.strengths} color="emerald"
                    />

                    {/* Weekly Goals Visual Checklist */}
                    <div className="p-8 rounded-[40px] bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 backdrop-blur-md flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-black text-sm text-white uppercase tracking-widest">Misiones Semanales</h4>
                                <div className="px-3 py-1 rounded-full bg-indigo-500 text-[10px] font-black text-white">
                                    {Array.isArray(recommendations.weeklyGoals) ? recommendations.weeklyGoals.filter(g => g.completed).length : 0} / {Array.isArray(recommendations.weeklyGoals) ? recommendations.weeklyGoals.length : 0}
                                </div>
                            </div>
                            <div className="space-y-4">
                                {Array.isArray(recommendations.weeklyGoals) ? recommendations.weeklyGoals.map((goal, i) => (
                                    <div key={i} className="flex items-start gap-4 group">
                                        <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-500 ${goal?.completed ? "bg-indigo-500 border-indigo-500 scale-110 shadow-lg shadow-indigo-500/20" : "border-white/10 group-hover:border-indigo-500/30"
                                            }`}>
                                            {goal?.completed && <Check size={12} strokeWidth={4} className="text-white" />}
                                        </div>
                                        <span className={`text-sm font-medium leading-tight ${goal?.completed ? "text-slate-500 line-through" : "text-slate-200"}`}>
                                            {typeof goal === 'string' ? goal : (goal?.text || 'Misión pendiente')}
                                        </span>
                                    </div>
                                )) : (
                                    <p className="text-slate-500 text-xs italic">Cargando misiones...</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Áreas de Mejora */}
                    <InsightCard
                        icon={Target} title="Áreas de Mejora"
                        items={recommendations.areasToImprove} color="indigo"
                    />

                    {/* Progresión de Fuerza Section */}
                    {strengthData.length > 0 && (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-4">
                            <h4 className="font-black text-xs text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                <TrendingUp size={16} className="text-emerald-400" /> Evolución de Fuerza Real
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {strengthData.map((data, i) => (
                                    <StrengthChart key={i} data={data.history} title={data.title} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ajustes Sugeridos */}
                    {Array.isArray(recommendations.weightRecommendations) && recommendations.weightRecommendations.length > 0 && (
                        <div className="p-6 rounded-[32px] bg-slate-900/50 border border-white/5 backdrop-blur-sm flex flex-col justify-between">
                            <div>
                                <h4 className="font-black text-xs text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Dumbbell size={14} /> Ajustes Sugeridos
                                </h4>
                                <div className="space-y-3">
                                    {recommendations.weightRecommendations.slice(0, 3).map((rec, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                            <span className="text-[11px] font-bold text-slate-300">{rec?.exercise}</span>
                                            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-white/5">
                                                <span className="text-[10px] text-slate-500">{rec?.currentWeight}kg</span>
                                                <ChevronRight size={10} className="text-slate-700" />
                                                <span className="text-[10px] font-black text-emerald-400">{rec?.recommendedWeight}kg</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-10 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <Heart size={14} className="text-indigo-400" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium italic">
                            "{recommendations.motivationalMessage}"
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/routines')}
                        className="group flex items-center gap-3 px-8 py-4 rounded-full bg-white text-slate-950 font-black text-sm transition-all hover:bg-indigo-50"
                    >
                        CONTINUAR ENTRENAMIENTO
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </div>
            </div>

            <AnimatePresence>
                {showScoreInfo && <ScoreExplanationModal onClose={() => setShowScoreInfo(false)} />}
            </AnimatePresence>
        </motion.div>
    );
});

export default AICoachCard;
