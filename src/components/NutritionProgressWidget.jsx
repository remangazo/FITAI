/**
 * NutritionProgressWidget - Dashboard Component
 * 
 * Muestra un resumen visual del progreso nutricional del día
 * integrado con el sistema de cálculo metabólico, entrenamiento y progresión.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Flame,
    Activity,
    Target,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    Apple,
    Zap,
    Dumbbell,
    Calendar,
    CheckCircle2,
    XCircle,
    BarChart3,
    Beef,
    Wheat,
    Droplets
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { calculateFullMetabolicProfile } from '../services/metabolicCalculator';
import { getDailyNutritionLog, setDailyMeals, setDailyTargetMacros } from '../services/nutritionService';
import { getWeeklyProgressSummary } from '../services/weeklyProgressService';
import { getLocalDateString, getDayName, getWeekStart } from '../utils/dateUtils';

export default function NutritionProgressWidget({ activities: externalActivities }) {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [metabolicProfile, setMetabolicProfile] = useState(null);
    const [todayProgress, setTodayProgress] = useState(null);
    const [weeklyProgress, setWeeklyProgress] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) {
            const metabolic = calculateFullMetabolicProfile(profile);
            setMetabolicProfile(metabolic);
        }

        if (user?.uid) {
            loadAllProgress();
        }
    }, [profile, user]);

    const loadAllProgress = async () => {
        try {
            const today = getLocalDateString();
            const metabolic = profile ? calculateFullMetabolicProfile(profile) : null;
            const fallbackTarget = metabolic ? metabolic.metabolism.targetCalories : 2000;

            // Robust target sync
            const diet = profile?.currentDietPlan;
            const targetCalories = Math.round(
                diet?.targetCalories ||
                diet?.dailyMacros?.calories ||
                diet?.summary?.calories ||
                fallbackTarget
            );

            let log = await getDailyNutritionLog(user.uid, today);

            const activeDiet = profile?.currentDietPlan;
            const capitalizedDay = getDayName();
            const dayPlanEntry = activeDiet?.weeklyPlan?.[capitalizedDay] ||
                activeDiet?.weeklyPlan?.[capitalizedDay.toLowerCase()];

            // Extract meals logically: handles both direct array and object { meals: [...] }
            const planForToday = Array.isArray(dayPlanEntry) ? dayPlanEntry :
                (dayPlanEntry?.meals || activeDiet?.meals || []);

            if ((!log.meals || log.meals.length === 0) && planForToday.length > 0) {
                console.log('[NutritionWidget] Syncing meals from active diet plan...');
                const formattedMeals = planForToday.map(m => ({
                    name: m.name || 'Comida',
                    time: m.time || '',
                    description: m.description || '',
                    macros: {
                        calories: Number(m.calories || m.macros?.calories || 0),
                        protein: Number(m.macros?.protein || 0),
                        carbs: Number(m.macros?.carbs || 0),
                        fats: Number(m.macros?.fats || 0)
                    }
                }));
                try {
                    await setDailyMeals(user.uid, today, formattedMeals);
                    // Also sync targets
                    const targets = {
                        calories: targetCalories,
                        protein: Math.round(diet?.dailyMacros?.protein || diet?.macros?.protein || metabolic?.dailyMacros?.protein || 150),
                        carbs: Math.round(diet?.dailyMacros?.carbs || diet?.macros?.carbs || metabolic?.dailyMacros?.carbs || 200),
                        fats: Math.round(diet?.dailyMacros?.fats || diet?.macros?.fats || metabolic?.dailyMacros?.fats || 60)
                    };
                    await setDailyTargetMacros(user.uid, today, targets);

                    // Reload log after sync
                    log = await getDailyNutritionLog(user.uid, today);
                } catch (e) {
                    console.error('[NutritionWidget] Failed auto-sync:', e);
                }
            }

            const weekly = await getWeeklyProgressSummary(user.uid, targetCalories);

            setTodayProgress(log);
            setWeeklyProgress(weekly);
        } catch (error) {
            console.error('[NutritionWidget] Error loading progress:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!metabolicProfile || loading) {
        return (
            <div className="glass p-6 rounded-3xl border border-white/10 animate-pulse">
                <div className="h-32 bg-white/5 rounded-2xl"></div>
            </div>
        );
    }

    const { metabolism, dailyMacros } = metabolicProfile;

    // Sincronización final del target
    // Sincronización final del target con fallback
    const target = Math.round(
        profile?.currentDietPlan?.targetCalories ||
        profile?.currentDietPlan?.dailyMacros?.calories ||
        todayProgress?.targetMacros?.calories ||
        metabolism?.targetCalories ||
        2000
    );
    const targetMacros = {
        protein: profile?.currentDietPlan?.macros?.protein || todayProgress?.targetMacros?.protein || dailyMacros?.protein || 150,
        carbs: profile?.currentDietPlan?.macros?.carbs || todayProgress?.targetMacros?.carbs || dailyMacros?.carbs || 200,
        fats: profile?.currentDietPlan?.macros?.fats || todayProgress?.targetMacros?.fats || dailyMacros?.fats || 60
    };
    const consumed = todayProgress?.totalMacros?.calories || 0;
    const activitiesToUse = externalActivities || todayProgress?.activities || [];
    const burned = activitiesToUse.reduce((sum, act) => sum + (act.caloriesBurned || 0), 0);

    // Unify logic with Nutrition.jsx: Effective Target = Base Target + Burned Bonus
    const effectiveTarget = target + burned;
    const progress = Math.min(100, Math.round((consumed / effectiveTarget) * 100));
    const remaining = Math.max(0, effectiveTarget - consumed);

    // Determine status color
    let statusColor = 'text-green-400';
    let statusBg = 'bg-green-500';
    let statusMessage = 'En déficit - vas bien';

    if (progress > 100) {
        statusColor = 'text-red-400';
        statusBg = 'bg-red-500';
        statusMessage = 'Excediste tu objetivo';
    } else if (progress > 85) {
        statusColor = 'text-yellow-400';
        statusBg = 'bg-yellow-500';
        statusMessage = 'Casi en el límite';
    } else if (progress < 30) {
        statusColor = 'text-blue-400';
        statusBg = 'bg-blue-500';
        statusMessage = 'Recién empezando';
    }

    const todayWorkout = weeklyProgress?.todayWorkout;
    const calorieSummary = weeklyProgress?.calories;
    const netBalance = consumed - burned;
    const isUnderTarget = netBalance <= target;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="group relative overflow-hidden rounded-[40px] bg-slate-950 border border-white/5 transition-all duration-500 hover:border-emerald-500/30 mb-8 cursor-pointer"
            onClick={() => navigate('/nutrition')}
        >
            {/* Glossy Background Effect */}
            <div className="absolute top-0 right-1/4 w-1/2 h-1/2 bg-emerald-600/5 blur-[120px] pointer-events-none" />

            <div className="relative z-10 p-6 md:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                            <Apple size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Registro Nutricional</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>{statusMessage}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-700" />
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    {new Date().toLocaleDateString('es', { weekday: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={20} className="text-slate-400" />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-center">
                    {/* Left: Circle & Main Stats */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 w-full lg:w-auto">
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 128 128">
                                <circle
                                    cx="64" cy="64" r="54"
                                    stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none"
                                />
                                <motion.circle
                                    cx="64" cy="64" r="54"
                                    stroke="url(#nutriGradient)" strokeWidth="8" fill="none"
                                    strokeLinecap="round"
                                    initial={{ strokeDasharray: "339.29", strokeDashoffset: 339.29 }}
                                    animate={{ strokeDashoffset: 339.29 - (339.29 * Math.min(100, progress) / 100) }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                                <defs>
                                    <linearGradient id="nutriGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#34d399" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-white">{progress}%</span>
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">Meta</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Balance Neto</span>
                                    <span className={`text-lg font-black ${isUnderTarget ? 'text-white' : 'text-red-400'}`}>
                                        {Math.round(netBalance)} <span className="text-xs text-slate-500 font-medium">kcal</span>
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (netBalance / target) * 100)}%` }}
                                        className={`h-full ${isUnderTarget ? 'bg-indigo-500' : 'bg-red-500'}`}
                                    />
                                </div>
                            </div>

                            <div className="flex items-stretch gap-4">
                                <div className="flex-1 p-4 rounded-3xl bg-white/[0.03] border border-white/5 group/stat flex flex-col justify-center">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-5 h-5 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                            <Zap size={10} className="text-indigo-400" />
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Restante</div>
                                    </div>
                                    <div className={`text-lg font-black ${remaining > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {remaining} <span className="text-[10px] opacity-70">kcal</span>
                                    </div>
                                </div>
                                {burned > 0 && (
                                    <div className="flex-1 p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 group/stat flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <Flame size={10} className="text-emerald-400" />
                                            </div>
                                            <div className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-wider">Bonus Entreno</div>
                                        </div>
                                        <div className="text-lg font-black text-emerald-400">
                                            +{burned} <span className="text-[10px] opacity-70">kcal</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Macros & Quick Insight */}
                    <div className="space-y-6">
                        {/* Macro Pills */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Proteína', val: todayProgress?.totalMacros?.protein || 0, target: targetMacros.protein, color: 'text-indigo-400', bg: 'bg-indigo-500/10', icon: Beef },
                                { label: 'Carbos', val: todayProgress?.totalMacros?.carbs || 0, target: targetMacros.carbs, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Wheat },
                                { label: 'Grasas', val: todayProgress?.totalMacros?.fats || 0, target: targetMacros.fats, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Droplets }
                            ].map((macro, i) => (
                                <div key={i} className={`p-3 rounded-3xl ${macro.bg} border border-white/5 text-center group/macro transition-all duration-300 hover:border-white/10`}>
                                    <div className="flex justify-center mb-1.5">
                                        <macro.icon size={14} className={macro.color} />
                                    </div>
                                    <div className={`text-sm font-black ${macro.color}`}>{macro.val}g</div>
                                    <div className="text-[8px] text-slate-500 font-bold uppercase mt-1">/ {macro.target}g {macro.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>Consistencia Semanal</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Dumbbell size={10} className="text-indigo-400" />
                                    <span className="text-indigo-400">
                                        {weeklyProgress?.training?.workoutsThisWeek || 0} entrenos
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-1.5 h-2">
                                {(calorieSummary?.dailyStats || [0, 1, 2, 3, 4, 5, 6]).map((day, i) => {
                                    // Determinar fecha para este índice (0 = Lunes)
                                    const weekStart = getWeekStart();
                                    const d = new Date(weekStart);
                                    d.setDate(weekStart.getDate() + i);
                                    const dayStr = getLocalDateString(d);
                                    const todayStr = getLocalDateString();

                                    // Si no hay datos, usar el objeto 'day' si existe, o verificar entrenamientos
                                    const hasTraining = day?.hasTraining || weeklyProgress?.training?.workouts?.some(w => {
                                        const wDate = w.startTime instanceof Date ? w.startTime :
                                            (w.startTime?.toDate ? w.startTime.toDate() : new Date(w.startTime));
                                        return getLocalDateString(wDate) === dayStr;
                                    });

                                    const isAdherent = day?.isOnTarget || hasTraining;
                                    const isTracked = day?.isTracked || hasTraining;
                                    const isFuture = dayStr > todayStr;

                                    return (
                                        <div
                                            key={i}
                                            className={`flex-1 rounded-full transition-all duration-700 ${isAdherent
                                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                                : isTracked
                                                    ? 'bg-red-500/40'
                                                    : isFuture
                                                        ? 'bg-white/5'
                                                        : 'bg-white/[0.03]'
                                                }`}
                                        />
                                    );
                                })}
                            </div>
                            <div className="mt-3 flex justify-between text-[9px] font-black text-slate-600 uppercase tracking-widest px-0.5">
                                <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div >
    );
}
