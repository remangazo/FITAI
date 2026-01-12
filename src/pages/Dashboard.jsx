import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, addDoc } from 'firebase/firestore';
import { generateWithOpenRouter } from '../services/openrouterService';
import { generateRoutine } from '../services/routineGenerator';
import { getActiveRoutine, saveRoutine, saveAndActivateRoutine } from '../services/routineService';
import { getProgressRecommendations } from '../services/progressService';
import { getWorkoutHistory, getAllPersonalRecords, getExerciseProgress } from '../services/workoutService';
import { calculateFullMetabolicProfile } from '../services/metabolicCalculator';
import { generateQuickPlan } from '../services/mealGenerator';
import { aiService } from '../services/aiService';
import { addActivityToLog, getDailyNutritionLog } from '../services/nutritionService';
import { getLocalDateString } from '../utils/dateUtils';
import { challengeService } from '../services/challengeService';
// Lazy load NotificationCenter to prevent circular dependency
const NotificationCenter = React.lazy(() => import('../components/NotificationCenter'));

// Lazy load components to prevent circular dependency issues
const RoutineModal = React.lazy(() => import('../components/RoutineModal'));
const ActiveWorkout = React.lazy(() => import('../components/ActiveWorkout'));
const WorkoutSummaryModal = React.lazy(() => import('../components/WorkoutSummaryModal'));
const AIThinkingModal = React.lazy(() => import('../components/AIThinkingModal'));
const AICoachCard = React.lazy(() => import('../components/AICoachCard'));
const NutritionProgressWidget = React.lazy(() => import('../components/NutritionProgressWidget'));
const InstallAppButton = React.lazy(() => import('../components/InstallAppButton'));
const ActivityTracker = React.lazy(() => import('../components/ActivityTracker'));
const InteractiveGuide = React.lazy(() => import('../components/InteractiveGuide'));
const InfluencerLiveBanner = React.lazy(() => import('../components/InfluencerLiveBanner'));
import {
    Dumbbell,
    Utensils,
    TrendingUp,
    Plus,
    Crown,
    Settings as SettingsIcon,
    LogOut,
    ChevronRight,
    ChevronDown,
    Download,
    Loader2,
    X,
    Calendar,
    Flame,
    Target,
    Droplets,
    User,
    Trophy,
    Play,
    Brain,
    UtensilsCrossed,
    Info,
    Scale,
    Sparkles
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

// Lazy load BottomNav to prevent circular dependency
const BottomNav = React.lazy(() => import('../components/Navigation').then(module => ({ default: module.BottomNav })));
const API_BASE = import.meta.env.VITE_FUNCTIONS_URL || '';

export default function Dashboard() {
    const { user, profile, logout, profileLoading, updateProfile } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [routines, setRoutines] = useState([]);
    const [diets, setDiets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatedDiet, setGeneratedDiet] = useState(null);
    const [generating, setGenerating] = useState({ routine: false, diet: false });
    const [showRoutineModal, setShowRoutineModal] = useState(false);
    const [showDietModal, setShowDietModal] = useState(false);
    const [showWorkout, setShowWorkout] = useState(false);
    const [activeRoutine, setActiveRoutine] = useState(null);
    const [generatedRoutine, setGeneratedRoutine] = useState(null); // Para vista previa antes de guardar
    const [expandedRoutine, setExpandedRoutine] = useState(null);
    const [expandedDiet, setExpandedDiet] = useState(null);
    const [workoutSummary, setWorkoutSummary] = useState(null); // Para modal de resumen post-entrenamiento
    const [showAIThinking, setShowAIThinking] = useState(false); // Para animación de "IA pensando"
    const [streamInfo, setStreamInfo] = useState({
        isLive: true, // Simulado para demostración
        platform: 'YouTube',
        streamUrl: 'https://youtube.com/@fitai_oficial',
        coachName: 'Coach Pro',
        coachAvatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=150&h=150'
    });

    // Global Modal Back-Button Handler
    useEffect(() => {
        const anyModalOpen = expandedDiet || showRoutineModal || workoutSummary || showWorkout || showAIThinking;

        if (anyModalOpen) {
            window.history.pushState({ modalOpen: true }, '');

            const handlePopState = () => {
                setExpandedDiet(null);
                setShowRoutineModal(false);
                setWorkoutSummary(null);
                setShowWorkout(false);
                setShowAIThinking(false);
            };

            window.addEventListener('popstate', handlePopState);
            return () => window.removeEventListener('popstate', handlePopState);
        }
    }, [expandedDiet, showRoutineModal, workoutSummary, showWorkout, showAIThinking]);
    const [pendingRoutine, setPendingRoutine] = useState(null); // Rutina generada esperando animación
    const [showWeightUpdate, setShowWeightUpdate] = useState(false);
    const [newWeight, setNewWeight] = useState(profile?.weight || '');
    const [showTutorial, setShowTutorial] = useState(false);

    const [strengthData, setStrengthData] = useState([]);
    const [loadingStrength, setLoadingStrength] = useState(false);
    const [todayActivities, setTodayActivities] = useState([]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Esperar a que el perfil termine de cargar en AuthContext
        if (profileLoading) return;

        // Validación de onboarding estricta usando Datos del Contexto (Source of Truth)
        if (!profile || !profile.onboardingCompleted) {
            navigate('/onboarding');
            return;
        }

        fetchData();
        loadDailyActivities();
        checkWeightUpdateRequirement();
        checkTutorialRequirement();
    }, [user, profile, profileLoading, navigate]);

    const checkTutorialRequirement = () => {
        if (profile && profile.onboardingCompleted && !profile.tutorialCompleted) {
            // CRITICAL FIX: Temporarily disabled automatic tutorial launch.
            // There is a persistent "ReferenceError: C is undefined" crash for new users
            // likely due to InteractiveGuide accessing unmounted DOM or lazy components.
            // Until fixed, we let users enter the dashboard safely without the tutorial.

            // setTimeout(() => {
            //     setShowTutorial(true);
            // }, 2000);

            console.warn('[Dashboard] Tutorial auto-launch skipped for stability.');
        }
    };

    const checkWeightUpdateRequirement = () => {
        if (!profile) return;

        const lastUpdate = profile.lastWeightUpdate ? new Date(profile.lastWeightUpdate) : new Date(profile.createdAt?.toDate?.() || profile.createdAt || 0);
        const now = new Date();
        const diffDays = Math.ceil((now - lastUpdate) / (1000 * 60 * 60 * 24));

        if (diffDays >= 7) {
            setShowWeightUpdate(true);
        }
    };

    const loadDailyActivities = async () => {
        if (!user?.uid) return;
        try {
            const today = getLocalDateString();
            const log = await getDailyNutritionLog(user.uid, today);
            setTodayActivities(log.activities || []);
        } catch (error) {
            console.error('[Dashboard] Error loading activities:', error);
        }
    };

    const handleActivityAdded = async (activity) => {
        if (!user?.uid) return;
        try {
            const today = getLocalDateString();
            await addActivityToLog(user.uid, today, activity);
            setTodayActivities(prev => [...prev, activity]);

            // Invalidate AI Coach cache so it picks up the new activity
            localStorage.removeItem('fitai_ai_recommendations');
            localStorage.removeItem('fitai_ai_recommendations_time');
        } catch (error) {
            console.error('[Dashboard] Error adding activity:', error);
        }
    };

    const fetchData = async () => {
        if (!user) return;

        try {
            console.log('[Dashboard] Fetching data for user:', user.uid);

            // Fetch real routines - simple query without orderBy to avoid index requirement
            const qRoutines = query(
                collection(db, 'routines'),
                where('userId', '==', user.uid)
            );
            const routineSnap = await getDocs(qRoutines);
            console.log('[Dashboard] Found', routineSnap.docs.length, 'routines');

            const fetchedRoutines = routineSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
            }));

            // Sort in memory
            fetchedRoutines.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
                return dateB - dateA;
            });

            setRoutines(fetchedRoutines.slice(0, 5));

            // Set active routine
            const active = fetchedRoutines.find(r => r.isActive === true);
            if (active) {
                setActiveRoutine(active);
            }

            // Cargar dieta activa - PRIORIDAD: profile.currentDietPlan > localStorage > Firestore collection
            let activeDiet = null;

            // 1. Intentar desde profile.currentDietPlan
            if (profile?.currentDietPlan) {
                activeDiet = {
                    ...profile.currentDietPlan,
                    id: 'current-from-profile',
                    // Agregar macros en formato compatible con la UI
                    macros: profile.currentDietPlan.weeklyMacros || {
                        protein: profile.currentDietPlan.dailyMacros?.protein,
                        carbs: profile.currentDietPlan.dailyMacros?.carbs,
                        fats: profile.currentDietPlan.dailyMacros?.fats
                    },
                    targetCalories: profile.currentDietPlan.weeklyMacros?.calories ||
                        profile.currentDietPlan.summary?.targetCalories
                };
                console.log('[Dashboard] Diet loaded from profile.currentDietPlan');
            }

            // 2. Si no hay en profile, intentar localStorage
            if (!activeDiet) {
                const userLocalStorageKey = `fitai_diet_plan_${user.uid}`;
                const savedDiet = JSON.parse(localStorage.getItem(userLocalStorageKey) || 'null');
                if (savedDiet) {
                    activeDiet = {
                        ...savedDiet,
                        id: 'current-from-localStorage',
                        macros: savedDiet.weeklyMacros || {},
                        targetCalories: savedDiet.weeklyMacros?.calories || savedDiet.summary?.targetCalories
                    };
                    console.log('[Dashboard] Diet loaded from localStorage');
                }
            }

            // 3. Solo si no hay nada, buscar en Firestore (legacy)
            if (!activeDiet) {
                const qDiets = query(
                    collection(db, 'diets'),
                    where('userId', '==', user.uid)
                );
                const dietSnap = await getDocs(qDiets);
                const fetchedDiets = dietSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
                }));

                fetchedDiets.sort((a, b) => {
                    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
                    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
                    return dateB - dateA;
                });

                if (fetchedDiets.length > 0) {
                    activeDiet = fetchedDiets[0];
                    console.log('[Dashboard] Diet loaded from Firestore collection (legacy)');
                }
            }

            setDiets(activeDiet ? [activeDiet] : []);

        } catch (error) {
            console.error("[Dashboard] Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };



    const handleGenerateRoutine = async () => {
        const workingProfile = profile;
        if (!workingProfile) {
            navigate('/onboarding');
            return;
        }

        setGenerating(prev => ({ ...prev, routine: true }));
        setShowAIThinking(true);

        try {
            // USAR GENERADOR DETERMINÍSTICO INTERNO (Vuelve a ser el estándar)
            // Esto evita problemas de Rate Limit y es 100% preciso anatómicamente
            const result = generateRoutine(workingProfile);

            // Guardamos el resultado para mostrarlo después de la animación
            setPendingRoutine(result);
        } catch (err) {
            console.error("Routine Generation Error:", err);
            setShowAIThinking(false);
            alert("Error al generar rutina: " + err.message);
        } finally {
            setGenerating(prev => ({ ...prev, routine: false }));
        }
    };

    // Callback cuando termina la animación de "IA pensando"
    const handleAIThinkingComplete = () => {
        setShowAIThinking(false);
        setGenerating(prev => ({ ...prev, routine: false }));
        if (pendingRoutine) {
            setGeneratedRoutine(pendingRoutine);
            setShowRoutineModal(true);
            setPendingRoutine(null);
        }
    };

    const handleSaveRoutine = async (routine) => {
        try {
            await saveRoutine(user.uid, routine);
            setShowRoutineModal(false);
            setGeneratedRoutine(null);
            alert("✅ Rutina guardada como borrador");
            fetchData(); // Refrescar lista
        } catch (error) {
            console.error("Error saving routine:", error);
            alert("Error al guardar rutina");
        }
    };

    const handleSaveAndActivateRoutine = async (routine) => {
        try {
            console.log("[Dashboard] Iniciando saveAndActivate para:", user.uid, routine.title);
            const routineId = await saveAndActivateRoutine(user.uid, routine, true);
            console.log("[Dashboard] Exito. ID:", routineId);
            setShowRoutineModal(false);
            setGeneratedRoutine(null);
            const active = await getActiveRoutine(user.uid);
            setActiveRoutine(active);
            alert("✅ Rutina activada correctamente");
            fetchData();
            loadStrengthData();
        } catch (error) {
            console.error("[Dashboard] Error fatal en activacion:", error);
            alert("Error al activar rutina: " + (error.message || 'Error de red o permisos'));
        }
    };

    const handleWorkoutComplete = (summary) => {
        setShowWorkout(false);
        // Agregar el nombre del día al summary para mostrarlo en el modal
        setWorkoutSummary({
            ...summary,
            dayName: activeRoutine?.routine?.days?.[0]?.day || 'Entrenamiento'
        });

        // REFRESH DATA: Actualizar rutina y stats inmediatamente
        fetchData();
        loadStrengthData();

        // GAMIFICATION: Update progress for 'workouts' challenge
        challengeService.updateProgress(user.uid, 'workouts', 1).then(updated => {
            if (updated) {
                console.log("Challenge progress updated!");
                // Optionally show a toast here
            }
        });
    };

    const handleGenerateDiet = async () => {
        if (!profile) {
            navigate('/onboarding');
            return;
        }

        setGenerating(prev => ({ ...prev, diet: true }));
        try {
            // NUEVO: Usar el motor metabólico y generador unificado
            const metabolicProfile = calculateFullMetabolicProfile(profile);
            const result = generateQuickPlan(metabolicProfile, profile.culture || 'Argentina');

            // Actualizar el perfil en Firestore de forma COMPLETA
            await updateProfile({
                currentDietPlan: result,
                lastDietGenerated: new Date().toISOString()
            });

            // Actualizar el state local para feedback inmediato
            setDiets([{ ...result, id: 'current-diet' }]);

            alert('¡Dieta generada y activada! Ve a la sección de Nutrición para ver los detalles.');

        } catch (err) {
            console.error("Diet Generation Error:", err);
            alert("Error al generar dieta: " + err.message);
        } finally {
            setGenerating(prev => ({ ...prev, diet: false }));
        }
    };

    const handleUpgrade = () => {
        navigate('/upgrade');
    };

    const loadStrengthData = async () => {
        if (!user?.uid) return;
        setLoadingStrength(true);
        try {
            // Get last 2 exercises with PRs or history
            const prs = await getAllPersonalRecords(user.uid);
            let exerciseNames = Object.keys(prs).slice(0, 2);

            if (exerciseNames.length === 0) {
                const history = await getWorkoutHistory(user.uid, 5);
                exerciseNames = [...new Set(history.flatMap(h => h.exercises?.map(ex => ex.name) || []))].slice(0, 2);
            }

            const historyPromises = exerciseNames.map(name => getExerciseProgress(user.uid, name));
            const results = await Promise.all(historyPromises);

            const formatted = exerciseNames.map((name, i) => ({
                name,
                history: results[i].map(h => {
                    const dateObj = h.date?.toDate ? h.date.toDate() : new Date(h.date);
                    return {
                        date: dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
                        weight: h.maxWeight
                    };
                })
            })).filter(ex => ex.history.length >= 1);

            setStrengthData(formatted);
        } catch (error) {
            console.error('[Dashboard] Error loading strength data:', error);
        } finally {
            setLoadingStrength(false);
        }
    };

    useEffect(() => {
        if (user?.uid) loadStrengthData();
    }, [user?.uid]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    const macrosData = diets[0]?.macros ? [
        { name: 'Proteína', value: diets[0].macros.protein, color: '#3b82f6' },
        { name: 'Carbos', value: diets[0].macros.carbs, color: '#22c55e' },
        { name: 'Grasas', value: diets[0].macros.fats, color: '#f59e0b' }
    ] : [];

    const handleUpdateWeight = async () => {
        if (!newWeight || isNaN(newWeight)) return;
        try {
            await updateProfile({ weight: newWeight });
            setShowWeightUpdate(false);
            alert("✅ Peso actualizado y registrado en tu historial.");
        } catch (error) {
            console.error("Error updating weight:", error);
        }
    };

    const handleTutorialComplete = async () => {
        try {
            await updateProfile({ tutorialCompleted: true });
            setShowTutorial(false);
        } catch (error) {
            console.error("Error saving tutorial progress:", error);
        }
    };

    // Preparar datos del gráfico con historial real
    const chartData = profile?.weightHistory?.length > 1
        ? profile.weightHistory.map(entry => ({
            day: new Date(entry.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
            w: parseFloat(entry.weight)
        }))
        : [
            { day: 'Objetivo', w: parseFloat(profile?.targetWeight || profile?.weight || 0) },
            { day: 'Actual', w: parseFloat(profile?.weight || 0) }
        ];

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        }>
            <div className="min-h-screen bg-slate-950 text-white font-sans pb-24 md:pb-0 overflow-x-hidden">
                {/* Header with Background Glow */}
                <div className="relative">
                    {showTutorial && <InteractiveGuide onComplete={handleTutorialComplete} />}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                </div>
                {/* Navbar */}
                <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-brand-indigo to-brand-cyan p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                                <Dumbbell size={22} className="text-white" />
                            </div>
                            <span className="title-brand text-2xl uppercase tracking-tighter">FitAI</span>
                            {profile?.isPremium && (
                                <span className="badge-premium">ELITE</span>
                            )}

                            <div className="hidden md:flex items-center ml-12 gap-8">
                                <button onClick={() => navigate('/dashboard')} className={`text-sm font-bold tracking-wide transition-all ${window.location.pathname === '/dashboard' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>PANEL</button>
                                <button onClick={() => navigate('/routines')} className={`text-sm font-bold tracking-wide transition-all ${window.location.pathname === '/routines' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>ENTRENO</button>
                                <button onClick={() => navigate('/nutrition')} className={`text-sm font-bold tracking-wide transition-all ${window.location.pathname === '/nutrition' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>DIETA</button>
                                <button onClick={() => navigate('/tools')} className={`text-sm font-bold tracking-wide transition-all ${window.location.pathname === '/tools' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>TOOLS</button>
                                <button onClick={() => navigate('/community')} className={`text-sm font-bold tracking-wide transition-all ${window.location.pathname === '/community' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>SOCIAL</button>
                                <button onClick={() => navigate('/shop')} className={`text-sm font-bold tracking-wide transition-all ${window.location.pathname === '/shop' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>TIENDA</button>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <NotificationCenter />
                            <button
                                onClick={() => navigate('/settings')}
                                className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5"
                            >
                                <SettingsIcon size={18} />
                            </button>
                            <div className="h-8 w-[1px] bg-white/5" />
                            <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors">
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-4 sm:space-y-8">
                    {/* Streaming Live Banner - Real-time Hub */}
                    <InfluencerLiveBanner
                        isLive={streamInfo.isLive}
                        platform={streamInfo.platform}
                        streamUrl={streamInfo.streamUrl}
                        coachName={streamInfo.coachName}
                        coachAvatar={streamInfo.coachAvatar}
                    />
                    {/* Welcome Header - Compact on mobile */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                        <div className="flex items-center gap-3 sm:gap-6">
                            <div className="relative">
                                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 p-[2px]">
                                    <div className="w-full h-full rounded-[10px] sm:rounded-[22px] bg-slate-900 flex items-center justify-center overflow-hidden border border-white/5">
                                        {profile?.avatarUrl ? (
                                            <img
                                                src={profile.avatarUrl}
                                                alt={profile.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'block';
                                                }}
                                            />
                                        ) : null}
                                        <User className={`${profile?.avatarUrl ? 'hidden' : 'block'} text-slate-400`} size={20} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                                    {t('dashboard.welcome', { name: profile?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Atleta' })}
                                </h1>
                                <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                                    <div className="flex items-center gap-1 text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                                        <Trophy size={12} /> Elite
                                    </div>
                                    <div className="w-1 h-1 bg-slate-700 rounded-full hidden sm:block" />
                                    <div className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider hidden sm:block">
                                        {profile?.isPremium ? 'Premium' : 'Free'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Install Prompt - Prominent for both mobile and desktop */}
                        <div className="w-full max-w-sm hidden sm:block">
                            <InstallAppButton />
                        </div>

                        <div className="flex gap-4">
                            {!profile?.isPremium && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleUpgrade}
                                    className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 text-sm sm:text-base"
                                >
                                    <Crown size={16} /> {t('dashboard.upgrade', 'Mejorar')}
                                </motion.button>
                            )}
                        </div>
                    </header>

                    {/* Gamification removed - will be real data in future */}

                    {/* AI Insights & Weekly Summary */}
                    <div className="grid grid-cols-1 gap-4">
                        {/* Weekly Progress */}
                        <div className="relative overflow-hidden rounded-[40px] border border-white/5 bg-slate-950 p-6 md:p-8" id="guide-workout">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/5 blur-[120px] pointer-events-none" />
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <Calendar className="text-indigo-400" size={18} /> Esta Semana
                                </h4>
                            </div>
                            <div className="relative z-10 mb-8">
                                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                                    {activeRoutine ? 'Listo para tu entreno?' : 'Tu viaje comienza hoy'}
                                </h3>
                                <p className="text-slate-400 font-medium leading-relaxed">
                                    {activeRoutine
                                        ? `Continúa con "${activeRoutine.title}". Mantén la constancia para ver resultados.`
                                        : 'Genera tu primera rutina personalizada con IA hoy mismo.'}
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => activeRoutine ? setShowWorkout(true) : navigate('/routines')}
                                className="relative z-10 w-full py-5 rounded-[24px] bg-white text-slate-950 font-black text-sm tracking-widest hover:bg-slate-100 transition-colors flex items-center justify-center gap-3"
                            >
                                <Play size={18} fill="currentColor" />
                                {activeRoutine ? 'CONTINUAR SESIÓN' : 'EMPEZAR AHORA'}
                            </motion.button>
                        </div>

                        {/* Weight Update Reminder */}
                        <AnimatePresence>
                            {showWeightUpdate && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="card-elite border-purple-500/30 bg-gradient-to-br from-slate-900 to-purple-950/20">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400">
                                                <Scale size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">💡 Hora de pesarse</h4>
                                                <p className="text-sm text-slate-400">Han pasado 7 días. Registra tu peso para ver tu progreso real.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="number"
                                                    value={newWeight}
                                                    onChange={(e) => setNewWeight(e.target.value)}
                                                    placeholder="00.0"
                                                    className="w-full bg-slate-800 border border-white/10 rounded-2xl px-4 py-3 font-black text-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">kg</span>
                                            </div>
                                            <button
                                                onClick={handleUpdateWeight}
                                                className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-purple-500/20"
                                            >
                                                REGISTRAR
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {/* IA Insights removed - will show real progress insights in future */}

                    {/* AI Coach Recommendations */}
                    <div id="guide-ia-coach">
                        <AICoachCard user={user} profile={profile} />
                    </div>

                    {/* Nutrition Progress Widget */}
                    <div id="guide-nutrition">
                        <NutritionProgressWidget activities={todayActivities} />
                    </div>

                    {/* Action & Stats Grid - Unified Elite Style */}
                    <section className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ActionCard
                            title={t('dashboard.new_routine', 'Nueva Rutina')}
                            icon={generating.routine ? <Loader2 className="animate-spin text-indigo-400" /> : <Plus className="text-indigo-400" />}
                            onClick={handleGenerateRoutine}
                            description={t('dashboard.routine_desc', 'Basada en tu nivel')}
                            disabled={generating.routine}
                            color="indigo"
                        />
                        <ActionCard
                            title={t('dashboard.new_diet', 'Nuevo Plan Dieta')}
                            icon={generating.diet ? <Loader2 className="animate-spin text-emerald-400" /> : <Plus className="text-emerald-400" />}
                            onClick={handleGenerateDiet}
                            description={t('dashboard.diet_desc', 'Recetas con macros')}
                            disabled={generating.diet}
                            color="emerald"
                        />
                        {profile?.weight && (
                            <StatsCard
                                title={t('dashboard.weight', 'Peso Corporal')}
                                value={`${profile.weight} ${profile.units === 'imperial' ? 'lb' : 'kg'}`}
                                icon={<Scale className="text-purple-400" size={20} />}
                                color="purple"
                            />
                        )}
                        {profile?.experienceYears && (
                            <StatsCard
                                title={t('dashboard.level', 'Nivel Atleta')}
                                value={profile.experienceYears}
                                icon={<Trophy className="text-amber-400" size={20} />}
                                color="amber"
                            />
                        )}
                    </section>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Column */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Routines Section */}
                            <section className="relative overflow-hidden rounded-[40px] border border-white/5 bg-slate-950 p-6 md:p-8" id="guide-routines">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[120px] pointer-events-none" />
                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <Dumbbell className="text-indigo-400" size={18} /> Mis Rutinas
                                    </h3>
                                    <button onClick={() => navigate('/routines')} className="text-[10px] font-black text-indigo-400 hover:text-white transition-colors tracking-widest">VER TODAS</button>
                                </div>
                                <div className="space-y-4 relative z-10">
                                    {routines.length === 0 ? (
                                        <div className="text-center py-12 rounded-[32px] border-2 border-dashed border-white/5">
                                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                                                Sin rutinas activas
                                            </p>
                                        </div>
                                    ) : (
                                        routines.slice(0, 3).map(r => (
                                            <RoutineCard
                                                key={r.id}
                                                routine={r}
                                                expanded={expandedRoutine === r.id}
                                                onToggle={() => setExpandedRoutine(expandedRoutine === r.id ? null : r.id)}
                                            />
                                        ))
                                    )}
                                </div>
                            </section>

                            {/* Progress Charts Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Body Weight Chart */}
                                {/* Body Weight Chart */}
                                <section className="relative overflow-hidden rounded-[40px] border border-white/5 bg-slate-950 p-6 md:p-8" id="guide-progress">
                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                            <TrendingUp className="text-blue-400" size={16} /> Evolución Corporal
                                        </h3>
                                        <button onClick={() => navigate('/progress')} className="text-[10px] font-black text-blue-400 hover:text-white transition-colors tracking-widest uppercase">Detalles</button>
                                    </div>
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorW" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                <XAxis dataKey="day" hide />
                                                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#0f172a',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '16px',
                                                        fontSize: '10px',
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                                <Area type="monotone" dataKey="w" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorW)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </section>

                                {/* Strength Progression Chart */}
                                <section className="relative overflow-hidden rounded-[40px] border border-white/5 bg-slate-950 p-6 md:p-8">
                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                            <Dumbbell className="text-emerald-400" size={16} /> Fuerza: {strengthData[0]?.name || 'Progreso'}
                                        </h3>
                                        <button onClick={() => navigate('/progress')} className="text-[10px] font-black text-emerald-400 hover:text-white transition-colors tracking-widest uppercase">Detalles</button>
                                    </div>
                                    <div className="h-48 w-full">
                                        {strengthData.length > 0 ? (
                                            strengthData[0].history.length >= 2 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={strengthData[0].history}>
                                                        <defs>
                                                            <linearGradient id="colorS" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                        <XAxis dataKey="date" hide />
                                                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: '#0f172a',
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                borderRadius: '16px',
                                                                fontSize: '10px',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                        <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorS)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center space-y-2">
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Última Marca</div>
                                                    <div className="text-4xl font-black text-white tracking-tighter">
                                                        {strengthData[0].history[0].weight} <span className="text-xs text-slate-500 italic">kg</span>
                                                    </div>
                                                    <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mt-2">
                                                        Primera Sesión Registrada
                                                    </p>
                                                </div>
                                            )
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center space-y-4">
                                                <div className="w-12 h-12 bg-white/[0.03] rounded-2xl border border-white/5 flex items-center justify-center text-slate-700">
                                                    <TrendingUp size={24} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">
                                                        Analizando registros...
                                                    </p>
                                                    <p className="text-[9px] text-slate-600 font-bold max-w-[140px] mx-auto">
                                                        Registra 1 sesión más para visualizar tu tendencia de fuerza.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Side Column */}
                        <div className="space-y-8">
                            {/* Sidebar / Recommendations */}
                            <aside className="space-y-6" id="guide-activity">
                                <ActivityTracker
                                    onActivityAdded={handleActivityAdded}
                                    dailyActivities={todayActivities}
                                />
                            </aside>
                            {/* Active Diet */}
                            <section className="relative overflow-hidden bg-slate-900 border border-white/5 p-8 rounded-[40px]">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none" />
                                <h3 className="text-xl font-black flex items-center gap-3 mb-8 text-white tracking-tight">
                                    <UtensilsCrossed size={22} className="text-emerald-400" />
                                    {t('nutrition.active_plan', 'Plan de Comidas')}
                                </h3>

                                {diets.length > 0 ? (
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-white/[0.03] rounded-2xl border border-white/5 text-orange-400">
                                                    <Flame size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-3xl font-black text-white tracking-tighter">
                                                        {diets[0].targetCalories || diets[0].calories} <span className="text-sm text-slate-500 italic">kcal</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Objetivo Diario</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Macros Pie Chart */}
                                        {macrosData.length > 0 && (
                                            <div className="relative h-44 flex items-center justify-center">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={macrosData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={55}
                                                            outerRadius={75}
                                                            paddingAngle={8}
                                                            dataKey="value"
                                                            stroke="none"
                                                        >
                                                            {macrosData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                    <span className="text-2xl font-black text-white tracking-tighter">100%</span>
                                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Balance</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-white/[0.02] p-4 rounded-3xl border border-white/5 text-center">
                                                <div className="text-sm font-black text-indigo-400">{diets[0].macros?.protein || 0}g</div>
                                                <div className="text-[8px] text-slate-500 font-black uppercase mt-1">Prot.</div>
                                            </div>
                                            <div className="bg-white/[0.02] p-4 rounded-3xl border border-white/5 text-center">
                                                <div className="text-sm font-black text-emerald-400">{diets[0].macros?.carbs || 0}g</div>
                                                <div className="text-[8px] text-slate-500 font-black uppercase mt-1">Carb.</div>
                                            </div>
                                            <div className="bg-white/[0.02] p-4 rounded-3xl border border-white/5 text-center">
                                                <div className="text-sm font-black text-amber-400">{diets[0].macros?.fats || 0}g</div>
                                                <div className="text-[8px] text-slate-500 font-black uppercase mt-1">Gras.</div>
                                            </div>
                                        </div>

                                        {/* Meals Preview */}
                                        <div className="bg-white/[0.02] rounded-3xl border border-white/5 divide-y divide-white/5">
                                            {diets[0].meals?.slice(0, 3).map((meal, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-4">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">{meal.name}</span>
                                                    <span className="text-sm font-black text-white">{meal.calories} kcal</span>
                                                </div>
                                            ))}
                                            {diets[0].meals?.length > 3 && (
                                                <button
                                                    onClick={() => setExpandedDiet(diets[0].id)}
                                                    className="w-full py-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors"
                                                >
                                                    Explorar menú completo →
                                                </button>
                                            )}
                                        </div>

                                        {/* Hydration */}
                                        {diets[0].hydration && (
                                            <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                                <Droplets className="text-blue-400" size={18} />
                                                <span className="text-xs font-black text-blue-400/80 uppercase tracking-widest">Meta: {diets[0].hydration} diarios</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 px-4 space-y-4">
                                        <div className="w-16 h-16 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center justify-center mx-auto">
                                            <Utensils size={24} className="text-slate-700" />
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium italic">
                                            {t('dashboard.no_diet', 'No hay un plan de alimentación activo.')}
                                        </p>
                                        <button
                                            onClick={() => navigate('/nutrition')}
                                            className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] border-b border-indigo-400/20 pb-1"
                                        >
                                            Generar ahora
                                        </button>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </main>

                {/* Diet Detail Modal */}
                <AnimatePresence>
                    {expandedDiet && diets.find(d => d.id === expandedDiet) && (
                        <DietDetailModal
                            diet={diets.find(d => d.id === expandedDiet)}
                            onClose={() => setExpandedDiet(null)}
                        />
                    )}
                </AnimatePresence>

                {/* Routine Modal */}
                <AnimatePresence>
                    {showRoutineModal && generatedRoutine && (
                        <RoutineModal
                            routine={generatedRoutine}
                            isNew={true}
                            onSave={handleSaveRoutine}
                            onSaveAndActivate={handleSaveAndActivateRoutine}
                            onClose={() => setShowRoutineModal(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Workout Summary Modal */}
                <AnimatePresence>
                    {workoutSummary && (
                        <WorkoutSummaryModal
                            summary={workoutSummary}
                            onClose={() => setWorkoutSummary(null)}
                        />
                    )}
                </AnimatePresence>

                {/* Active Workout Overlay - Se mantiene global si está iniciada */}
                {showWorkout && activeRoutine && (
                    <ActiveWorkout
                        routine={activeRoutine}
                        onComplete={handleWorkoutComplete}
                        onClose={() => setShowWorkout(false)}
                    />
                )}

                {/* AI Thinking Animation Modal */}
                <AnimatePresence>
                    {showAIThinking && (
                        <AIThinkingModal
                            isOpen={showAIThinking}
                            onComplete={handleAIThinkingComplete}
                        />
                    )}
                </AnimatePresence>

                {/* Mobile Bottom Nav */}
                <BottomNav />
            </div>
        </Suspense>
    );
}

// Sub-components (local to file for simplicity, should be moved)
const ActionCard = ({ title, icon, onClick, description, disabled, color = "indigo" }) => {
    const colors = {
        indigo: "from-indigo-500/10 hover:border-indigo-500/30",
        emerald: "from-emerald-500/10 hover:border-emerald-500/30",
        purple: "from-purple-500/10 hover:border-purple-500/30",
        amber: "from-amber-500/10 hover:border-amber-500/30"
    };

    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.02, y: -2 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            onClick={onClick}
            disabled={disabled}
            className={`relative overflow-hidden bg-slate-900 border border-white/5 p-6 rounded-[32px] text-left transition-all h-full flex flex-col justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : `bg-gradient-to-br ${colors[color]} hover:shadow-xl hover:shadow-${color}-500/10`}`}
        >
            <div className={`w-12 h-12 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center mb-4 text-white shadow-inner`}>
                {icon}
            </div>
            <div>
                <h4 className="font-black text-white text-[15px] mb-1 tracking-tight leading-tight">{title}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-tight">{description}</p>
            </div>
        </motion.button>
    );
};

const StatsCard = ({ title, value, icon, color = "emerald" }) => {
    const colors = {
        emerald: "from-emerald-500/10 shadow-emerald-500/5",
        purple: "from-purple-500/10 shadow-purple-500/5",
        amber: "from-amber-500/10 shadow-amber-500/5",
        indigo: "from-indigo-500/10 shadow-indigo-500/5"
    };

    return (
        <div className={`relative overflow-hidden bg-slate-900 border border-white/5 p-6 rounded-[32px] bg-gradient-to-br ${colors[color]} h-full flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-4">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.1em]">{title}</span>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5 text-slate-400 shadow-inner">
                    {icon}
                </div>
            </div>
            <div className="text-2xl font-black text-white tracking-tighter leading-none">{value}</div>
        </div>
    );
};

const RoutineCard = ({ routine, expanded, onToggle }) => (
    <motion.div
        layout
        className={`relative overflow-hidden rounded-[32px] border transition-all duration-300 ${expanded ? 'bg-slate-900 border-indigo-500/30 shadow-2xl shadow-indigo-500/5' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="p-5 flex items-center justify-between cursor-pointer group" onClick={onToggle}>
            <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${routine.isActive ? 'bg-indigo-500/10 border-indigo-400/20 text-indigo-400 shadow-lg shadow-indigo-500/10' : 'bg-white/[0.03] border-white/5 text-slate-500'}`}>
                    <Dumbbell size={22} />
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-black text-white text-lg tracking-tight">{routine.name || routine.title}</h4>
                        {routine.isActive && (
                            <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[8px] font-black text-emerald-400 uppercase tracking-tighter">
                                ACTIVA
                            </div>
                        )}
                        {routine.isAssignedByCoach && (
                            <div className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[8px] font-black text-indigo-400 uppercase tracking-tighter flex items-center gap-1">
                                <Sparkles size={8} /> MI COACH
                            </div>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em]">{routine.daysPerWeek} ENTRENAMIENTOS SEMANALES · {routine.goal}</p>
                </div>
            </div>
            <div className={`p-3 rounded-2xl transition-all ${expanded ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-500'}`}>
                {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
        </div>
        <AnimatePresence>
            {expanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "circOut" }}
                    className="border-t border-white/5"
                >
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estructura del Plan</h5>
                            <div className="grid grid-cols-1 gap-3">
                                {routine.days?.map((day, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/5">
                                        <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center text-[10px] font-black text-indigo-400">
                                            D{idx + 1}
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-white uppercase tracking-tight">{day.day}</div>
                                            <div className="text-[10px] text-slate-500 font-medium">{day.focus}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 rounded-[32px] bg-indigo-500/5 border border-indigo-500/10 h-fit">
                            <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Descripción</h5>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">"{routine.description}"</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
);

const DietDetailModal = ({ diet, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-900 rounded-3xl max-w-lg w-full max-h-[80vh] overflow-y-auto border border-white/10"
        >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
                <h3 className="font-bold text-xl text-white">Plan Nutricional</h3>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
                <div className="text-center">
                    <div className="text-3xl font-black text-white mb-1">{diet.targetCalories} kcal</div>
                    <div className="text-sm text-slate-400">Objetivo Diario</div>
                </div>
                <div className="space-y-4">
                    {diet.meals?.map((meal, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-white">{meal.name}</h4>
                                <span className="text-xs font-bold bg-slate-700 px-2 py-1 rounded text-slate-300">{meal.calories} kcal</span>
                            </div>
                            <ul className="text-sm text-slate-400 space-y-1 list-disc pl-4">
                                {meal.foods?.map((food, fIdx) => (
                                    <li key={fIdx}>{food}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                {diet.notes && (
                    <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-500/20">
                        <h4 className="font-bold text-blue-400 text-sm mb-2 flex items-center gap-2"><Info size={16} /> Notas</h4>
                        <p className="text-sm text-slate-300">{diet.notes}</p>
                    </div>
                )}
            </div>
        </motion.div>
    </div>
);
