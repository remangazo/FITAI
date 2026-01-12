// Daily Meal Plan - Component for tracking weekly nutrition with daily selection and meal extras
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, Plus, X, Clock, Flame, AlertTriangle,
    ChevronDown, ChevronUp, Trash2, Sparkles, Loader2,
    Calendar, Utensils, Zap, Droplets, Beef, Wheat, Apple,
    ShoppingBag, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    getDailyNutritionLog,
    toggleMealCompletion,
    addCustomFood,
    removeCustomFood,
    getMacroAlerts,
    setDailyMeals,
    setDailyTargetMacros
} from '../services/nutritionService';
import { calculateFoodMacros } from '../services/openrouterService';
import { calculateFullMetabolicProfile } from '../services/metabolicCalculator';
import { getLocalDateString, getDayName } from '../utils/dateUtils';

export default function DailyMealPlan({ dietPlan, targetMacros = null }) {
    const { user, profile } = useAuth();
    const [dailyLog, setDailyLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddFood, setShowAddFood] = useState(false);
    const [addFoodToMeal, setAddFoodToMeal] = useState(null);
    const [expandedMeal, setExpandedMeal] = useState(null);
    const [alerts, setAlerts] = useState([]);

    // Day Selection
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const getInitialDay = () => {
        try {
            const capitalizedDay = getDayName();
            const normalized = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const found = days.find(d => normalized(d) === normalized(capitalizedDay));
            return found || 'Lunes';
        } catch (e) {
            return 'Lunes';
        }
    };

    const [selectedDay, setSelectedDay] = useState(getInitialDay());

    const getSelectedDate = (dayName) => {
        try {
            const today = new Date();
            today.setHours(12, 0, 0, 0);
            const dayMap = { 'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
            const normalized = (str) => str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const targetNorm = normalized(dayName);
            const entry = Object.entries(dayMap).find(([k]) => normalized(k) === targetNorm);

            const selectedDayNum = entry ? entry[1] : 1;
            const currentDayNum = today.getDay();

            // Treat Monday as 1 and Sunday as 7 for a consistent weekly view
            const adjSelectedDayNum = selectedDayNum === 0 ? 7 : selectedDayNum;
            const adjCurrentDayNum = currentDayNum === 0 ? 7 : currentDayNum;

            const diff = adjSelectedDayNum - adjCurrentDayNum;
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + diff);

            return getLocalDateString(targetDate);
        } catch (error) {
            return getLocalDateString();
        }
    };

    const activeDate = getSelectedDate(selectedDay);

    useEffect(() => {
        if (user && dietPlan) {
            loadDailyLog();
        } else {
            setLoading(false);
        }
    }, [user, selectedDay, activeDate, dietPlan]);

    const loadDailyLog = async () => {
        if (!user) return;
        setLoading(true);
        setDailyLog(null);
        setAlerts([]);

        try {
            const log = await getDailyNutritionLog(user.uid, activeDate);
            const planForDay = dietPlan?.weeklyPlan?.[selectedDay] || dietPlan?.meals || [];

            if ((!log.meals || log.meals.length === 0) && planForDay.length > 0) {
                const formattedMeals = planForDay.map(m => ({
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
                    await setDailyMeals(user.uid, activeDate, formattedMeals);
                    log.meals = formattedMeals;
                } catch (e) {
                    console.error('[DailyMealPlan] Failed to initialize meals:', e);
                }
            }

            const getValidTargets = (t) => {
                if (!t || t.calories > 10000 || t.calories < 500) return null;
                return {
                    calories: Math.round(t.calories),
                    protein: Math.round(t.protein),
                    carbs: Math.round(t.carbs),
                    fats: Math.round(t.fats)
                };
            };

            let targets = getValidTargets(log.targetMacros) ||
                getValidTargets(dietPlan?.weeklyMacros) ||
                getValidTargets(targetMacros);

            if (!targets) {
                const metabolic = profile ? calculateFullMetabolicProfile(profile) : null;
                if (metabolic) {
                    targets = {
                        calories: metabolic.metabolism.targetCalories,
                        protein: metabolic.dailyMacros.protein,
                        carbs: metabolic.dailyMacros.carbs,
                        fats: metabolic.dailyMacros.fats
                    };
                } else {
                    const weight = profile?.weight || 75;
                    targets = {
                        calories: Math.round(weight * 30),
                        protein: Math.round(weight * 2.0),
                        carbs: Math.round(weight * 3.5),
                        fats: Math.round(weight * 0.8)
                    };
                }
            }

            if (!getValidTargets(log.targetMacros)) {
                try {
                    await setDailyTargetMacros(user.uid, activeDate, targets);
                    log.targetMacros = targets;
                } catch (e) {
                    console.error('[DailyMealPlan] Failed to sync targets:', e);
                }
            }

            setDailyLog(log);
            if (log.totalMacros) {
                setAlerts(getMacroAlerts(log.totalMacros, log.targetMacros || targets));
            }
        } catch (error) {
            console.error('[DailyMealPlan] Critical error:', error);
            setDailyLog(null);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleMeal = async (mealIndex) => {
        if (!user || !dailyLog) return;
        const isCompleted = dailyLog.completedMeals?.includes(mealIndex);
        try {
            const result = await toggleMealCompletion(user.uid, activeDate, mealIndex, !isCompleted);
            setDailyLog(prev => ({
                ...prev,
                completedMeals: result.completedMeals,
                totalMacros: result.totalMacros
            }));
            setAlerts(getMacroAlerts(result.totalMacros, dailyLog.targetMacros));
        } catch (error) {
            console.error('[DailyMealPlan] Toggle error:', error);
        }
    };

    const handleAddCustomFood = async (food, mealIndex = null) => {
        if (!user) return;
        try {
            const result = await addCustomFood(user.uid, activeDate, { ...food, mealIndex });
            setDailyLog(prev => ({
                ...prev,
                customFoods: result.customFoods,
                totalMacros: result.totalMacros
            }));
            setShowAddFood(false);
            setAddFoodToMeal(null);
        } catch (error) {
            console.error('[DailyMealPlan] Add food error:', error);
        }
    };

    const handleRemoveCustomFood = async (foodId) => {
        if (!user) return;
        try {
            const result = await removeCustomFood(user.uid, activeDate, foodId);
            setDailyLog(prev => ({
                ...prev,
                customFoods: result.customFoods,
                totalMacros: result.totalMacros
            }));
        } catch (error) {
            console.error('[DailyMealPlan] Remove food error:', error);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-20">
                <Loader2 className="animate-spin w-10 h-10 text-indigo-500 mx-auto mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Actualizando tu plan...</p>
            </div>
        );
    }

    if (!dailyLog) {
        return (
            <div className="text-center py-20 bg-slate-900 border border-white/5 rounded-[40px] px-10">
                <AlertTriangle className="mx-auto text-amber-500 mb-6" size={48} />
                <h3 className="text-2xl font-black text-white">Error de Conexión</h3>
                <p className="text-slate-500 font-medium mt-2">No pudimos sincronizar los datos de este día.</p>
                <button onClick={() => window.location.reload()} className="mt-8 bg-indigo-500 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest">Reintentar</button>
            </div>
        );
    }

    const meals = dailyLog.meals || [];
    const completedMeals = dailyLog.completedMeals || [];
    const totalMacros = dailyLog.totalMacros || { calories: 0, protein: 0, carbs: 0, fats: 0 };
    const baseTargets = dailyLog.targetMacros || { calories: 2000, protein: 150, carbs: 200, fats: 70 };
    const bonusCaloriesFromLog = dailyLog.activities?.reduce((sum, act) => sum + (act.caloriesBurned || 0), 0) || 0;

    const targets = {
        ...baseTargets,
        calories: baseTargets.calories + bonusCaloriesFromLog
    };

    return (
        <div className="space-y-8">
            {/* Day Selector - Modern Design */}
            <section className="bg-slate-900/50 border border-white/5 p-4 rounded-[32px] overflow-hidden">
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {days.map((day) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`flex-shrink-0 px-6 py-3 rounded-2xl text-xs font-black transition-all ${selectedDay === day
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {day.substring(0, 3).toUpperCase()}
                        </button>
                    ))}
                </div>
            </section>

            {/* Date Indicator & Progress Summary */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Calendar size={16} />
                    </div>
                    <div>
                        <span className="text-sm font-black text-white tracking-tight">{selectedDay}</span>
                        <span className="text-[10px] text-slate-500 font-bold ml-2 uppercase tracking-widest">{activeDate}</span>
                    </div>
                </div>
                <div className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest">
                    {completedMeals.length}/{meals.length} COMIDAS
                </div>
            </div>

            {/* Macro Alerts */}
            <AnimatePresence>
                {alerts.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                        {alerts.map((alert, i) => (
                            <div key={i} className={`flex items-start gap-4 p-5 rounded-[24px] border border-white/5 bg-slate-900 backdrop-blur-md`}>
                                <div className={`p-2 rounded-xl bg-white/5 ${alert.severity === 'high' ? 'text-red-400' : 'text-amber-400'}`}>
                                    <AlertTriangle size={20} />
                                </div>
                                <p className="text-sm font-medium text-slate-300 leading-relaxed">{alert.message}</p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Progress Dashboard */}
            <section className="relative overflow-hidden bg-slate-900 border border-white/10 p-8 rounded-[40px] shadow-2xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl pointer-events-none" />

                {/* Activity Bonus Notice */}
                {bonusCaloriesFromLog > 0 && (
                    <div className="flex items-center justify-between mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[28px] relative z-10">
                        <div className="flex items-center gap-3">
                            <Zap size={18} className="text-emerald-400" />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">+ {bonusCaloriesFromLog} kcal extra por actividad</span>
                        </div>
                    </div>
                )}

                <div className="space-y-10">
                    <MacroBar label="Energía Total" current={totalMacros.calories} target={targets.calories} unit="kcal" color="indigo" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <MacroBar label="Proteína" current={totalMacros.protein} target={targets.protein} unit="g" color="indigo" compact />
                        <MacroBar label="Carbohidratos" current={totalMacros.carbs} target={targets.carbs} unit="g" color="emerald" compact />
                        <MacroBar label="Grasas" current={totalMacros.fats} target={targets.fats} unit="g" color="amber" compact />
                    </div>
                </div>
            </section>

            {/* Meal List - Premium Cards */}
            <div className="space-y-4">
                {meals.length > 0 ? (
                    meals.map((meal, index) => (
                        <MealItem
                            key={index}
                            meal={meal}
                            index={index}
                            completed={completedMeals.includes(index)}
                            expanded={expandedMeal === index}
                            extras={dailyLog.customFoods?.filter(f => f.mealIndex === index) || []}
                            onToggle={() => handleToggleMeal(index)}
                            onExpand={() => setExpandedMeal(expandedMeal === index ? null : index)}
                            onAddExtra={() => { setAddFoodToMeal(index); setShowAddFood(true); }}
                            onRemoveExtra={handleRemoveCustomFood}
                        />
                    ))
                ) : (
                    <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[40px]">
                        <Utensils className="mx-auto text-slate-800 mb-6" size={48} />
                        <h4 className="text-xl font-black text-slate-500">Sin Menú Planificado</h4>
                        <p className="text-slate-600 text-sm font-medium mt-2">Puedes añadir alimentos manualmente.</p>
                    </div>
                )}
            </div>

            {/* Extras Section */}
            <div className="pt-10 space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-3">
                        <Plus size={20} className="text-indigo-400" />
                        Extras y Antojos
                    </h4>
                    <button
                        onClick={() => { setAddFoodToMeal(null); setShowAddFood(true); }}
                        className="bg-white/[0.05] hover:bg-white/[0.1] px-5 py-2.5 rounded-full text-[10px] text-white font-black uppercase tracking-widest border border-white/5 transition-all"
                    >
                        Añadir Manual
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {dailyLog.customFoods?.filter(f => f.mealIndex === null || f.mealIndex === undefined).map((food) => (
                        <motion.div
                            layout
                            key={food.id}
                            className="bg-slate-900 border border-white/5 p-5 rounded-[32px] flex items-center justify-between group hover:border-white/10 transition-all shadow-lg"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-xs">
                                    {food.calories}
                                </div>
                                <div>
                                    <div className="font-black text-sm text-white uppercase tracking-tight">{food.name}</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{food.protein}g P • {food.carbs}g C • {food.fats}g G</div>
                                </div>
                            </div>
                            <button onClick={() => handleRemoveCustomFood(food.id)} className="p-3 bg-white/5 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded-2xl transition-all">
                                <Trash2 size={16} />
                            </button>
                        </motion.div>
                    ))}
                    {dailyLog.customFoods?.filter(f => f.mealIndex === null || f.mealIndex === undefined).length === 0 && (
                        <div className="col-span-full py-8 bg-white/[0.01] border border-white/5 rounded-[32px] text-center italic text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                            No has registrado extras hoy
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showAddFood && (
                    <AddFoodModal
                        mealName={addFoodToMeal !== null ? (meals[addFoodToMeal]?.name || 'Comida') : null}
                        onAdd={(food) => handleAddCustomFood(food, addFoodToMeal)}
                        onClose={() => setShowAddFood(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function MealItem({ meal, index, completed, expanded, extras, onToggle, onExpand, onAddExtra, onRemoveExtra }) {
    const mealIcons = [<Apple size={20} />, <Zap size={20} />, <Utensils size={20} />, <Flame size={20} />, <Droplets size={20} />];
    const extraCals = extras.reduce((sum, e) => sum + Number(e.calories || 0), 0);
    const extraProt = extras.reduce((sum, e) => sum + Number(e.protein || 0), 0);

    const baseCals = Number(meal.calories || meal.macros?.calories || 0);
    const baseProt = Number(meal.macros?.protein || 0);
    const baseCarb = Number(meal.macros?.carbs || 0);
    const baseFat = Number(meal.macros?.fats || 0);

    const totalCals = baseCals + extraCals;
    const totalProt = baseProt + extraProt;
    const totalCarb = baseCarb + (extras.reduce((sum, e) => sum + Number(e.carbs || 0), 0));
    const totalFat = baseFat + (extras.reduce((sum, e) => sum + Number(e.fats || 0), 0));

    return (
        <motion.div
            layout
            className={`relative overflow-hidden transition-all duration-300 bg-slate-900 border ${completed ? 'border-emerald-500/30' : 'border-white/5'} rounded-[40px]`}
        >
            {completed && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none" />}

            <div className="p-5 sm:p-8 flex flex-col gap-4 relative z-10">
                <div className="flex items-center gap-3 sm:gap-6">
                    <button
                        onClick={onToggle}
                        className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shadow-lg ${completed ? 'bg-emerald-500 text-white' : 'bg-white/[0.03] border border-white/10 text-slate-700 hover:text-indigo-400 hover:border-indigo-400/30'
                            }`}
                    >
                        {completed ? <Check size={20} className="sm:w-6 sm:h-6" /> : <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-current opacity-30" />}
                    </button>

                    <div className="flex-1 cursor-pointer group min-w-0" onClick={onExpand}>
                        <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-1">
                            <div className="text-slate-400 group-hover:text-indigo-400 transition-colors mt-0.5 sm:mt-0 flex-shrink-0">
                                {mealIcons[index] || mealIcons[2]}
                            </div>
                            <h5 className={`font-black uppercase tracking-tight leading-tight text-sm sm:text-base ${completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                                {meal.name}
                            </h5>
                        </div>
                        {meal.time && (
                            <div className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-7 sm:ml-8">
                                <Clock size={10} className="text-indigo-500/50 sm:w-3 sm:h-3" /> {meal.time}
                            </div>
                        )}
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddExtra(); }}
                            className="p-2.5 sm:p-3 bg-white/[0.03] hover:bg-emerald-500/10 text-slate-600 hover:text-emerald-400 rounded-xl sm:rounded-2xl transition-all"
                        >
                            <Plus size={18} className="sm:w-5 sm:h-5" />
                        </button>
                        <button
                            onClick={onExpand}
                            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all ${expanded ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-700 hover:text-white'}`}
                        >
                            {expanded ? <ChevronUp size={18} className="sm:w-5 sm:h-5" /> : <ChevronDown size={18} className="sm:w-5 sm:h-5" />}
                        </button>
                    </div>
                </div>

                {/* Nutrition Summary Table - Visible on Mobile and Desktop */}
                <div className="grid grid-cols-4 gap-2 ml-1 sm:ml-20">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2 sm:p-3 text-center transition-all hover:bg-white/[0.04]">
                        <div className={`text-sm sm:text-lg font-black tracking-tighter ${completed ? 'text-slate-500' : 'text-white'}`}>
                            {totalCals}
                        </div>
                        <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-500">Kcal</div>
                    </div>
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-2 sm:p-3 text-center transition-all hover:bg-indigo-500/10">
                        <div className={`text-sm sm:text-lg font-black tracking-tighter ${completed ? 'text-indigo-400/50' : 'text-indigo-400'}`}>
                            {totalProt}g
                        </div>
                        <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-indigo-400/50 text-center">Proteína</div>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2 sm:p-3 text-center transition-all hover:bg-emerald-500/10">
                        <div className={`text-sm sm:text-lg font-black tracking-tighter ${completed ? 'text-emerald-400/50' : 'text-emerald-400'}`}>
                            {totalCarb}g
                        </div>
                        <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-emerald-400/50">Carbos</div>
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-2 sm:p-3 text-center transition-all hover:bg-amber-500/10">
                        <div className={`text-sm sm:text-lg font-black tracking-tighter ${completed ? 'text-amber-400/50' : 'text-amber-400'}`}>
                            {totalFat}g
                        </div>
                        <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-amber-400/50">Grasas</div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/5 bg-black/20">
                        <div className="p-8 space-y-6">
                            <div className="relative">
                                <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500/30 rounded-full" />
                                <p className="pl-6 text-sm text-slate-400 leading-relaxed font-medium italic">
                                    {meal.description || 'Consulta esta comida en tu registro diario.'}
                                </p>
                            </div>

                            {extras.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-px bg-white/5 flex-1" />
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] whitespace-nowrap">Extras Registrados</span>
                                        <div className="h-px bg-white/5 flex-1" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {extras.map(extra => (
                                            <div key={extra.id} className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/5 group">
                                                <span className="text-xs font-black text-slate-300 uppercase tracking-tight">{extra.name}</span>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs font-black text-emerald-400">{extra.calories} kcal</span>
                                                    <button onClick={() => onRemoveExtra(extra.id)} className="text-slate-700 hover:text-red-400 transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contextual Offer - Non-invasive suggestion */}
                            <ContextualOffer
                                meal={meal}
                                index={index}
                                completedCount={dailyLog.completedMeals?.length || 0}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function MacroBar({ label, current, target, unit, color, compact }) {
    const percentage = Math.min(100, Math.round((current / (target || 1)) * 100));
    const isOver = current > target;

    const colors = {
        indigo: 'bg-indigo-500 shadow-indigo-500/20',
        emerald: 'bg-emerald-500 shadow-emerald-500/20',
        amber: 'bg-amber-500 shadow-amber-500/20',
        blue: 'bg-blue-500 shadow-blue-500/20'
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</span>
                <div className="text-right">
                    <span className={`text-lg font-black tracking-tighter ${isOver ? 'text-amber-400' : 'text-white'}`}>
                        {current}
                    </span>
                    <span className="text-[10px] text-slate-600 font-black ml-1 uppercase">/ {target} {unit}</span>
                </div>
            </div>
            <div className={`relative ${compact ? 'h-3' : 'h-4'} bg-white/[0.03] rounded-full overflow-hidden p-[3px] border border-white/5`}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full rounded-full ${isOver ? 'bg-amber-500' : colors[color]} transition-all shadow-lg`}
                />
            </div>
        </div>
    );
}

function AddFoodModal({ mealName, onAdd, onClose }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleCalculate = async () => {
        if (!input.trim()) return;
        setLoading(true);
        try {
            const data = await calculateFoodMacros(input);
            setResult(data);
        } catch (e) {
            alert('Error calculando macros');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-md overflow-hidden relative z-10 shadow-3xl"
            >
                <div className="p-10">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Registro Directo</h3>
                            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">
                                {mealName ? `AÑADIENDO A: ${mealName.toUpperCase()}` : 'CALCULADORA NUTRICIONAL'}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-600 transition-colors"><X size={20} /></button>
                    </div>

                    <div className="space-y-8">
                        {!result ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">¿Qué comiste?</label>
                                    <textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder="Ej: 2 pechugas de pollo y 100g de arroz integral..."
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-3xl p-6 text-sm text-white focus:border-indigo-500/50 outline-none transition-all h-32 resize-none leading-relaxed font-medium"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={handleCalculate}
                                    disabled={loading || !input.trim()}
                                    className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl shadow-indigo-500/10 flex items-center justify-center gap-3 transition-all"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={20} /> ANALIZAR CON IA</>}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] text-center space-y-6">
                                    <div className="inline-flex p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 mb-2">
                                        <Check size={24} />
                                    </div>
                                    <p className="font-black text-xl text-white tracking-tight uppercase">{result.name}</p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                                            <div className="text-2xl font-black text-white tracking-tighter">{result.calories}</div>
                                            <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Kcal</div>
                                        </div>
                                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                                            <div className="text-2xl font-black text-indigo-400 tracking-tighter">{result.protein}g</div>
                                            <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Proteína</div>
                                        </div>
                                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                                            <div className="text-2xl font-black text-emerald-400 tracking-tighter">{result.carbs}g</div>
                                            <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Carbos</div>
                                        </div>
                                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                                            <div className="text-2xl font-black text-amber-400 tracking-tighter">{result.fats}g</div>
                                            <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Grasas</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setResult(null)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500">Volver</button>
                                    <button onClick={() => onAdd(result)} className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-400 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-xl shadow-emerald-500/10">CONFIRMAR</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

/**
 * ContextualOffer Component
 * Suggests a product based on meal context (time, macros, type)
 * Designed to be non-obtrusive and helpful.
 */
function ContextualOffer({ meal, index, completedCount }) {
    // 1. Inteligencia Sensorial: No mostrar sugerencias hasta que el usuario haya interactuado mínimamente (mín. 2 comidas completadas hoy)
    // Esto evita la sensación de "publicidad inmediata" en la primera experiencia.
    if (completedCount < 2) return null;

    // 2. Frecuencia Controlada: Solo un 30% de probabilidad de aparecer en comidas elegibles
    // Usamos el índice para que la decisión sea persistente por sesión si se desea, pero aquí usamos random para dinamismo.
    const showChance = React.useMemo(() => Math.random() > 0.7, []);
    if (!showChance) return null;

    const getOffer = (meal, idx) => {
        const protein = Number(meal.macros?.protein || 0);
        const name = (meal.name || '').toLowerCase();

        // Reglas de Valor Real (Solo sugerir si hay un beneficio claro)
        if (protein > 25) {
            return {
                id: 'creatina',
                title: 'Refuerzo de Recuperación',
                desc: 'Esta comida es rica en proteína. La creatina optimiza la síntesis en estas ventanas.',
                icon: <Zap size={14} className="text-slate-500" />,
                action: 'Ver más'
            };
        }

        if (idx === 0 || name.includes('desayuno')) {
            return {
                id: 'preworkout',
                title: 'Optimización Genética',
                desc: 'Activa tu metabolismo matutino con micronutrientes específicos.',
                icon: <Sparkles size={14} className="text-slate-500" />,
                action: 'Explorar'
            };
        }

        return null; // Si no hay un "match" perfecto, mejor no mostrar nada
    };

    const offer = getOffer(meal, index);
    if (!offer) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 rounded-[24px] bg-white/[0.01] border border-white/5 flex items-center gap-4 group cursor-pointer hover:bg-white/[0.03] transition-all"
        >
            <div className="p-2.5 bg-slate-900/50 rounded-xl text-slate-600 border border-white/5">
                {offer.icon}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sugerencia Inteligente</span>
                </div>
                <h6 className="text-[12px] font-bold text-slate-400 tracking-tight leading-tight">{offer.title}</h6>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">{offer.desc}</p>
            </div>
            <button className="text-[9px] font-black text-indigo-400/50 uppercase tracking-widest group-hover:text-indigo-400 transition-all px-3">
                {offer.action}
            </button>
        </motion.div>
    );
}
