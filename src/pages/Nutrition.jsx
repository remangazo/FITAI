import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    UtensilsCrossed, RefreshCw, Sparkles, Flame,
    Droplets, Brain, Target, TrendingUp, Info,
    Zap, Beef, Wheat, Apple, ChevronRight, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { BottomNav, BackButton } from '../components/Navigation';
import { getDailyNutritionLog, getWeeklyNutritionStats, addActivityToLog, removeActivityFromLog } from '../services/nutritionService';
import { calculateFullMetabolicProfile } from '../services/metabolicCalculator';
import { generateWeeklyPlan } from '../services/mealGenerator';
import DailyMealPlan from '../components/DailyMealPlan';
import ActivityTracker from '../components/ActivityTracker';
import AIThinkingModal from '../components/AIThinkingModal';

export default function Nutrition() {
    const navigate = useNavigate();
    const { profile, updateProfile, user } = useAuth();
    const { showToast } = useNotifications?.() || { showToast: () => { } };
    const [activeTab, setActiveTab] = useState('overview');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAIThinking, setShowAIThinking] = useState(false);
    const [dietPlan, setDietPlan] = useState(null);
    const [weeklyStats, setWeeklyStats] = useState(null);
    const [dailyActivities, setDailyActivities] = useState([]);

    // Single source of truth for metabolic data
    const metabolicProfile = useMemo(() => {
        if (!profile) return null;
        return calculateFullMetabolicProfile(profile);
    }, [profile]);

    // Single source of truth for energy targets (Sync)
    const targets = useMemo(() => {
        const fallback = metabolicProfile ? {
            calories: metabolicProfile.metabolism.targetCalories,
            protein: metabolicProfile.dailyMacros.protein,
            carbs: metabolicProfile.dailyMacros.carbs,
            fats: metabolicProfile.dailyMacros.fats,
            source: 'metabolic'
        } : { calories: 2000, protein: 150, carbs: 200, fats: 60, source: 'default' };

        if (!profile) return fallback;

        // Priority: Active Diet Plan > Metabolic Profile Calculation
        const diet = profile.currentDietPlan;
        if (diet && (diet.targetCalories || diet.calories || diet.macros)) {
            return {
                calories: Math.round(diet.targetCalories || diet.summary?.calories || diet.calories || fallback.calories),
                protein: Math.round(diet.macros?.protein || diet.summary?.protein || diet.protein || fallback.protein),
                carbs: Math.round(diet.macros?.carbs || diet.summary?.carbs || diet.carbs || fallback.carbs),
                fats: Math.round(diet.macros?.fats || diet.summary?.fats || diet.fats || fallback.fats),
                source: 'plan'
            };
        }

        return fallback;
    }, [profile, metabolicProfile]);

    useEffect(() => {
        if (!user?.uid) return;

        // Load saved diet plan
        const userLocalStorageKey = `fitai_diet_plan_${user.uid}`;
        const savedDiet = profile?.currentDietPlan || JSON.parse(localStorage.getItem(userLocalStorageKey) || 'null');
        if (savedDiet) setDietPlan(savedDiet);

        loadWeeklyStats();
        loadTodayLog();
    }, [profile, user]);

    const loadTodayLog = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const log = await getDailyNutritionLog(user.uid, today);
            if (log.activities) setDailyActivities(log.activities);
        } catch (error) {
            console.error('[Nutrition] Error loading today log:', error);
        }
    };

    const loadWeeklyStats = async () => {
        try {
            const stats = await getWeeklyNutritionStats(user.uid);
            setWeeklyStats(stats);
        } catch (error) {
            console.error('[Nutrition] Error loading stats:', error);
        }
    };

    const handleActivityAdded = async (activity) => {
        try {
            await addActivityToLog(user.uid, null, activity);
            setDailyActivities(prev => [...prev, activity]);
            showToast({
                type: 'success',
                title: 'Actividad Registrada',
                message: `${activity.name}: -${activity.caloriesBurned} kcal`
            });
        } catch (error) {
            console.error('[Nutrition] Error saving activity:', error);
            showToast({ type: 'error', title: 'Error', message: 'No se pudo guardar la actividad' });
        }
    };

    const handleGenerateDiet = async () => {
        if (!metabolicProfile || !user?.uid) {
            showToast({ type: 'error', title: 'Error', message: 'No se pudo calcular tu perfil metabólico.' });
            return;
        }

        const userLocalStorageKey = `fitai_diet_plan_${user.uid}`;
        setShowAIThinking(true);
        setIsGenerating(true);

        try {
            // Using the AI-powered generateWeeklyPlan for high variety
            const result = await generateWeeklyPlan(metabolicProfile, {
                culture: profile?.culture || 'Argentina',
                avoid: profile?.restrictions || [],
                onProgress: (p) => {
                    console.log(`[Nutrition] Generation Progress: ${p.progress}% - ${p.message}`);
                }
            });

            if (result) {
                setDietPlan(result);
                localStorage.setItem(userLocalStorageKey, JSON.stringify(result));
                await updateProfile?.({ currentDietPlan: result });
                showToast({ type: 'success', title: '¡Listo!', message: 'Plan nutricional IA generado con éxito' });
            }
        } catch (error) {
            console.error('[Nutrition] Error generating diet:', error);
            showToast({ type: 'error', title: 'Error', message: 'No se pudo generar la dieta con IA' });
        } finally {
            setIsGenerating(false);
            setShowAIThinking(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white pb-32">
            {/* Header Area */}
            <header className="relative pt-8 pb-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full -mr-48 -mt-24 pointer-events-none" />
                <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -ml-48 -mt-24 pointer-events-none" />

                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <BackButton to="/dashboard" />
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Nutrición</h1>
                                <p className="text-slate-400 font-medium">Sincronización total con tu metabolismo y plan de entrenamiento</p>
                            </div>
                        </div>

                        <div className="w-full overflow-x-auto scrollbar-hide pb-2 -mb-2">
                            <div className="flex bg-white/[0.03] p-1 rounded-2xl border border-white/5 backdrop-blur-md w-max md:w-full">
                                {[
                                    { id: 'overview', label: 'Resumen', icon: <Target size={16} /> },
                                    { id: 'plan', label: 'Mi Plan', icon: <UtensilsCrossed size={16} /> },
                                    { id: 'macros', label: 'Calculadora', icon: <TrendingUp size={16} /> },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-5 md:px-6 py-3 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap ${activeTab === tab.id
                                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                            : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 space-y-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* Daily Caloric Balance Section */}
                            <section className="relative overflow-hidden bg-slate-900 border border-white/5 p-6 md:p-8 rounded-[40px] shadow-lg shadow-indigo-500/5">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-500">
                                        <Flame size={24} fill="currentColor" />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Balance Calórico Diario</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center group">
                                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Objetivo Base</span>
                                        <span className="font-black text-lg text-white tabular-nums">{targets.calories} <span className="text-xs text-slate-600 font-bold uppercase ml-1">kcal</span></span>
                                    </div>

                                    <div className="flex justify-between items-center group">
                                        <span className="text-emerald-500/70 font-bold uppercase text-[10px] tracking-widest">+ Actividad Extra</span>
                                        <span className="font-black text-lg text-emerald-400 tabular-nums">+{dailyActivities.reduce((acc, curr) => acc + (curr.caloriesBurned || 0), 0)} <span className="text-xs opacity-60 font-bold uppercase ml-1">kcal</span></span>
                                    </div>

                                    <div className="relative pt-4 mt-4">
                                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
                                            <div>
                                                <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 block">Presupuesto Disponible</span>
                                                <h4 className="text-2xl md:text-4xl font-black text-white tracking-tighter leading-none">
                                                    Puedes comer hoy
                                                </h4>
                                            </div>
                                            <div className="text-left md:text-right">
                                                <div className="text-4xl md:text-5xl font-black text-amber-500 tracking-tighter tabular-nums leading-none">
                                                    {(targets.calories || 0) + dailyActivities.reduce((acc, curr) => acc + (curr.caloriesBurned || 0), 0)}
                                                    <span className="text-sm md:text-lg text-amber-600 ml-2 font-bold uppercase tracking-widest">kcal</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {dailyActivities.length > 0 && (
                                    <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs md:text-sm font-bold flex gap-3 items-center">
                                        <TrendingUp size={16} className="shrink-0" />
                                        <p>¡Bien! Tu actividad te permite comer más hoy sin salirte del objetivo.</p>
                                    </div>
                                )}
                            </section>

                            {/* Main Progress & Metabolism Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Weekly Progress Card */}
                                <section className="relative overflow-hidden bg-slate-900 border border-white/5 p-8 rounded-[40px]">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-3xl pointer-events-none" />

                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">Rendimiento</span>
                                            <h2 className="text-2xl font-black text-white tracking-tight">Progreso Semanal</h2>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-black text-white">{weeklyStats?.averages.calories || 0}</div>
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Kcal media real</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6 mb-10">
                                        <div className="bg-white/[0.02] p-4 rounded-3xl border border-white/5 text-center flex flex-col items-center gap-2">
                                            <div className="p-2 rounded-full bg-indigo-500/10 text-indigo-400">
                                                <Beef size={16} />
                                            </div>
                                            <div>
                                                <div className="text-xl font-black text-white">{weeklyStats?.averages.protein || 0}g</div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase">Prot.</div>
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.02] p-4 rounded-3xl border border-white/5 text-center flex flex-col items-center gap-2">
                                            <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400">
                                                <Wheat size={16} />
                                            </div>
                                            <div>
                                                <div className="text-xl font-black text-white">{weeklyStats?.averages.carbs || 0}g</div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase">Carb.</div>
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.02] p-4 rounded-3xl border border-white/5 text-center flex flex-col items-center gap-2">
                                            <div className="p-2 rounded-full bg-amber-500/10 text-amber-400">
                                                <Flame size={16} />
                                            </div>
                                            <div>
                                                <div className="text-xl font-black text-white">{weeklyStats?.averages.fats || 0}g</div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase">Gras.</div>
                                            </div>
                                        </div>
                                    </div>

                                    {weeklyStats && targets && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider">
                                                <span className="text-slate-500">Tendencia Semanal</span>
                                                <span className={Math.round(weeklyStats.averages.calories) <= Math.round(targets.calories) ? 'text-indigo-400' : 'text-amber-400'}>
                                                    {Math.round(weeklyStats.averages.calories) <= Math.round(targets.calories) ? 'En Déficit' : 'En Superávit'}
                                                </span>
                                            </div>
                                            <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, (weeklyStats.averages.calories / (targets.calories || 1)) * 100)}%` }}
                                                    className={`h-full rounded-full ${Math.round(weeklyStats.averages.calories) <= Math.round(targets.calories) ? 'bg-indigo-500' : 'bg-amber-500'}`}
                                                />
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                                                Estas son tus métricas promedio de los últimos 7 días. {Math.round(weeklyStats.averages.calories) <= Math.round(targets.calories)
                                                    ? 'Mantenlo así para una pérdida de grasa optimizada.'
                                                    : 'Estás nutriendo tus músculos para el crecimiento.'}
                                            </p>
                                        </div>
                                    )}
                                </section>

                                {/* Metabolism Card */}
                                <section className="relative overflow-hidden bg-slate-900 border border-white/5 p-8 rounded-[40px]">
                                    <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-500/10 blur-3xl pointer-events-none" />

                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">Metabolismo</span>
                                            <h2 className="text-2xl font-black text-white tracking-tight">Precisión Científica</h2>
                                        </div>
                                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                                            <Zap size={24} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/[0.03] p-5 rounded-[32px] border border-white/5">
                                            <div className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1">TMB Basal</div>
                                            <div className="text-2xl font-black text-white tracking-tighter">{metabolicProfile?.metabolism.tmb} <span className="text-xs text-slate-600">kcal</span></div>
                                        </div>
                                        <div className="bg-white/[0.03] p-5 rounded-[32px] border border-white/5">
                                            <div className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1">TDEE Total</div>
                                            <div className="text-2xl font-black text-white tracking-tighter">{metabolicProfile?.metabolism.tdee} <span className="text-xs text-slate-600">kcal</span></div>
                                        </div>
                                        <div className="col-span-2 bg-indigo-500/10 p-6 rounded-[32px] border border-indigo-500/20">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <div className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <Target size={14} /> Objetivo Diario
                                                    </div>
                                                    <div className="text-4xl font-black text-white tracking-tighter">{targets.calories} <span className="text-lg text-indigo-400/50 italic">kcal</span></div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-sm font-black uppercase tracking-widest ${metabolicProfile?.metabolism.adjustmentType === 'deficit' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                        {metabolicProfile?.metabolism.adjustment > 0 ? 'Superávit' : 'Déficit'}
                                                    </div>
                                                    <div className="text-xl font-black text-white">
                                                        {metabolicProfile?.metabolism.adjustment > 0 ? '+' : ''}{metabolicProfile?.metabolism.adjustment} kcal
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-start gap-3 p-4 bg-white/[0.02] rounded-2xl border border-white/5 text-[11px] text-slate-400 leading-relaxed">
                                        <Info size={16} className="text-blue-400 shrink-0" />
                                        <p>{metabolicProfile?.metabolism.explanation}</p>
                                    </div>
                                </section>
                            </div>

                            {/* Macro Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatsBox icon={<Beef size={20} />} label="Proteína" value={`${targets.protein}g`} color="indigo" />
                                <StatsBox icon={<Wheat size={20} />} label="Carbos" value={`${targets.carbs}g`} color="emerald" />
                                <StatsBox icon={<Flame size={20} />} label="Grasas" value={`${targets.fats}g`} color="amber" />
                                <StatsBox icon={<Droplets size={20} />} label="Hidratación" value="3.5L" color="blue" />
                            </div>

                            {/* Activity Tracking Section */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                                        <Activity size={24} className="text-indigo-400" />
                                        Actividad Extra
                                    </h3>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Sincronizado hoy</div>
                                </div>
                                <ActivityTracker onActivityAdded={handleActivityAdded} dailyActivities={dailyActivities} />
                            </section>

                            {/* Daily Insight Box */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-600 p-8 rounded-[40px] shadow-2xl shadow-indigo-500/20">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-32 -mt-32" />
                                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                                    <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shrink-0">
                                        <Brain size={40} className="text-white" />
                                    </div>
                                    <div className="text-center md:text-left space-y-2">
                                        <h3 className="text-2xl font-black text-white tracking-tight">Análisis Predictivo</h3>
                                        <p className="text-white/80 font-medium leading-relaxed">
                                            Basado en tu actividad de hoy y tu peso actual ({profile?.weight}kg), estás logrando un equilibrio perfecto. {dailyActivities.length > 0 ? `Tus actividades extra han compensado ~${dailyActivities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0)} kcal, permitiéndote mayor flexibilidad hoy.` : 'Considera registrar un paseo ligero si planeas una cena más pesada.'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('plan')}
                                        className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm hover:scale-[1.05] transition-all whitespace-nowrap shadow-xl"
                                    >
                                        VER MI PLAN DIARIO
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'plan' && (
                        <motion.div
                            key="plan"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {dietPlan ? (
                                <div className="space-y-8">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                                        <h2 className="text-3xl font-black text-white tracking-tight">Tu Plan Nutricional IA</h2>
                                        <button
                                            onClick={handleGenerateDiet}
                                            disabled={isGenerating}
                                            className="flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-slate-400 hover:text-white px-6 py-3 rounded-2xl font-bold transition-all text-sm"
                                        >
                                            <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
                                            Regenerar menú completo
                                        </button>
                                    </div>
                                    <DailyMealPlan dietPlan={dietPlan} targetMacros={targets} />
                                </div>
                            ) : (
                                <div className="bg-slate-900 border border-white/5 rounded-[40px] p-20 text-center space-y-6">
                                    <div className="w-24 h-24 bg-white/[0.03] rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-white/5">
                                        <UtensilsCrossed size={48} className="text-slate-700" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white">Sin Plan Activo</h3>
                                    <p className="text-slate-400 max-w-sm mx-auto font-medium">Genera una guía de alimentación optimizada matemáticamente para tu perfil actual.</p>
                                    <button
                                        onClick={handleGenerateDiet}
                                        disabled={isGenerating}
                                        className="bg-indigo-500 hover:bg-indigo-400 shadow-xl shadow-indigo-500/20 px-10 py-5 rounded-[22px] font-black text-lg inline-flex items-center gap-3 transition-all"
                                    >
                                        <Sparkles size={24} /> CREAR MI DIETA IA
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'macros' && (
                        <motion.div
                            key="macros"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="max-w-2xl mx-auto"
                        >
                            <MacroInsights profile={profile} targets={targets} metabolic={metabolicProfile} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <AnimatePresence>
                {showAIThinking && (
                    <AIThinkingModal
                        isOpen={showAIThinking}
                        mode="nutrition"
                        onComplete={() => setShowAIThinking(false)}
                    />
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
}

const StatsBox = ({ icon, label, value, color }) => {
    const variants = {
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/10',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/10',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/10',
    };

    return (
        <div className={`p-6 rounded-[32px] border flex flex-col items-center justify-center text-center space-y-2 backdrop-blur-md ${variants[color]}`}>
            <div className="mb-1">{icon}</div>
            <div className="text-2xl font-black tracking-tight">{value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</div>
        </div>
    );
};

const MacroInsights = ({ profile, targets, metabolic }) => {
    const macros = [
        { name: 'Proteína', value: targets.protein, unit: 'g', kcal: targets.protein * 4, color: 'bg-indigo-500', icon: <Beef size={18} /> },
        { name: 'Carbohidratos', value: targets.carbs, unit: 'g', kcal: targets.carbs * 4, color: 'bg-emerald-500', icon: <Wheat size={18} /> },
        { name: 'Grasas', value: targets.fats, unit: 'g', kcal: targets.fats * 9, color: 'bg-amber-500', icon: <Droplets size={18} /> },
    ];

    return (
        <div className="bg-slate-900 border border-white/5 p-10 rounded-[40px] space-y-10">
            <div className="text-center space-y-2">
                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">Calculadora de Macros</span>
                <h2 className="text-5xl font-black text-white tracking-tighter">{targets.calories} <span className="text-xl text-slate-500">kcal / día</span></h2>
            </div>

            <div className="space-y-8">
                {macros.map((macro, idx) => {
                    const percentage = Math.round((macro.kcal / targets.calories) * 100);
                    return (
                        <div key={idx} className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl bg-white/5 ${macro.color.replace('bg-', 'text-')}`}>{macro.icon}</div>
                                    <span className="font-black text-lg">{macro.name}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-white">{macro.value}{macro.unit}</div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{percentage}% de energía</div>
                                </div>
                            </div>
                            <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, delay: idx * 0.1 }}
                                    className={`h-full rounded-full ${macro.color}`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-6 bg-indigo-500/5 rounded-[32px] border border-indigo-500/10 flex items-start gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400"><Brain size={24} /></div>
                <div className="space-y-1">
                    <h4 className="font-black text-white uppercase text-xs tracking-widest">Base del Cálculo</h4>
                    <p className="text-[13px] text-slate-400 leading-relaxed font-medium italic">
                        "Estos macros están ajustados científicamente a tu peso de {profile?.weight}kg y tu objetivo de {profile?.primaryGoal === 'muscle' ? 'ganancia muscular' : 'pérdida de grasa'}. El plan busca optimizar la síntesis proteica mientras mantiene tus niveles de energía estables."
                    </p>
                </div>
            </div>
        </div>
    );
};
