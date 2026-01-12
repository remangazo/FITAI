// Nutrition Tracking Service - CRUD for daily meal tracking and macro calculations
import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    setDoc,
    query,
    where,
    Timestamp
} from 'firebase/firestore';

/**
 * Get or create today's nutrition log
 * @param {string} userId - User ID
 * @param {string} date - Date string YYYY-MM-DD
 * @returns {Object} - Daily nutrition log
 */
export const getDailyNutritionLog = async (userId, date = null) => {
    const today = new Date();
    const dateStr = date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const logId = `${userId}_${dateStr}`;

    try {
        const docRef = doc(db, 'nutritionLogs', logId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }

        // Create new log if doesn't exist
        const newLog = {
            userId,
            date: dateStr,
            meals: [],
            customFoods: [],
            completedMeals: [],
            activities: [],
            totalMacros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
            targetMacros: null, // Will be set from diet plan
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        await setDoc(docRef, newLog);
        return { id: logId, ...newLog };

    } catch (error) {
        console.error('[NutritionService] Error getting daily log:', error);
        throw error;
    }
};

/**
 * Mark a meal as completed
 * @param {string} userId - User ID
 * @param {string} date - Date string YYYY-MM-DD
 * @param {number} mealIndex - Index of the meal
 * @param {boolean} completed - Completed status
 */
export const toggleMealCompletion = async (userId, date, mealIndex, completed = true) => {
    const today = new Date();
    const dateStr = date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const logId = `${userId}_${dateStr}`;

    try {
        const log = await getDailyNutritionLog(userId, dateStr);
        let completedMeals = [...(log.completedMeals || [])];

        if (completed && !completedMeals.includes(mealIndex)) {
            completedMeals.push(mealIndex);
        } else if (!completed) {
            completedMeals = completedMeals.filter(i => i !== mealIndex);
        }

        // Recalculate totals
        const totalMacros = calculateTotalMacros(log.meals, completedMeals, log.customFoods);

        await updateDoc(doc(db, 'nutritionLogs', logId), {
            completedMeals,
            totalMacros,
            updatedAt: Timestamp.now()
        });

        return { completedMeals, totalMacros };

    } catch (error) {
        console.error('[NutritionService] Error toggling meal:', error);
        throw error;
    }
};

/**
 * Add a custom food item
 * @param {string} userId - User ID
 * @param {string} date - Date string
 * @param {Object} food - { name, calories, protein, carbs, fats, quantity, unit }
 */
export const addCustomFood = async (userId, date, food) => {
    const today = new Date();
    const dateStr = date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const logId = `${userId}_${dateStr}`;

    try {
        const log = await getDailyNutritionLog(userId, dateStr);
        const customFoods = [...(log.customFoods || [])];

        customFoods.push({
            ...food,
            id: Date.now().toString(),
            addedAt: new Date().toISOString()
        });

        // Recalculate totals
        const totalMacros = calculateTotalMacros(log.meals, log.completedMeals, customFoods);

        await updateDoc(doc(db, 'nutritionLogs', logId), {
            customFoods,
            totalMacros,
            updatedAt: Timestamp.now()
        });

        return { customFoods, totalMacros };

    } catch (error) {
        console.error('[NutritionService] Error adding custom food:', error);
        throw error;
    }
};

/**
 * Add an activity to the daily log
 * @param {string} userId - User ID
 * @param {string} date - Date string
 * @param {Object} activity - { name, caloriesBurned, durationMinutes, category }
 */
export const addActivityToLog = async (userId, date, activity) => {
    const today = new Date();
    const dateStr = date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const logId = `${userId}_${dateStr}`;

    try {
        const log = await getDailyNutritionLog(userId, dateStr);
        const activities = [...(log.activities || [])];

        activities.push({
            ...activity,
            id: activity.id || Date.now().toString(),
            addedAt: new Date().toISOString()
        });

        await updateDoc(doc(db, 'nutritionLogs', logId), {
            activities,
            updatedAt: Timestamp.now()
        });

        return { activities };

    } catch (error) {
        console.error('[NutritionService] Error adding activity:', error);
        throw error;
    }
};

/**
 * Remove an activity from the daily log
 * @param {string} userId - User ID
 * @param {string} date - Date string
 * @param {string} activityId - Activity ID to remove
 */
export const removeActivityFromLog = async (userId, date, activityId) => {
    const today = new Date();
    const dateStr = date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const logId = `${userId}_${dateStr}`;

    try {
        const log = await getDailyNutritionLog(userId, dateStr);
        const activities = (log.activities || []).filter(a => a.id !== activityId);

        await updateDoc(doc(db, 'nutritionLogs', logId), {
            activities,
            updatedAt: Timestamp.now()
        });

        return { activities };

    } catch (error) {
        console.error('[NutritionService] Error removing activity:', error);
        throw error;
    }
};

/**
 * Remove a custom food item
 * @param {string} userId - User ID
 * @param {string} date - Date string
 * @param {string} foodId - Food ID to remove
 */
export const removeCustomFood = async (userId, date, foodId) => {
    const today = new Date();
    const dateStr = date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const logId = `${userId}_${dateStr}`;

    try {
        const log = await getDailyNutritionLog(userId, dateStr);
        const customFoods = (log.customFoods || []).filter(f => f.id !== foodId);

        // Recalculate totals
        const totalMacros = calculateTotalMacros(log.meals, log.completedMeals, customFoods);

        await updateDoc(doc(db, 'nutritionLogs', logId), {
            customFoods,
            totalMacros,
            updatedAt: Timestamp.now()
        });

        return { customFoods, totalMacros };

    } catch (error) {
        console.error('[NutritionService] Error removing custom food:', error);
        throw error;
    }
};

/**
 * Set target macros for a day
 * @param {string} userId - User ID
 * @param {string} date - Date string
 * @param {Object} targets - { calories, protein, carbs, fats }
 */
export const setDailyTargetMacros = async (userId, date, targets) => {
    const today = new Date();
    const dateStr = date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const logId = `${userId}_${dateStr}`;

    try {
        await getDailyNutritionLog(userId, dateStr); // Ensure log exists

        await updateDoc(doc(db, 'nutritionLogs', logId), {
            targetMacros: targets,
            updatedAt: Timestamp.now()
        });

    } catch (error) {
        console.error('[NutritionService] Error setting targets:', error);
        throw error;
    }
};

/**
 * Set meals for a day from diet plan
 * @param {string} userId - User ID
 * @param {string} date - Date string
 * @param {Array} meals - Array of meal objects
 */
export const setDailyMeals = async (userId, date, meals) => {
    const today = new Date();
    const dateStr = date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const logId = `${userId}_${dateStr}`;

    try {
        await getDailyNutritionLog(userId, dateStr); // Ensure log exists

        await updateDoc(doc(db, 'nutritionLogs', logId), {
            meals,
            updatedAt: Timestamp.now()
        });

    } catch (error) {
        console.error('[NutritionService] Error setting meals:', error);
        throw error;
    }
};

/**
 * Calculate total macros from completed meals and custom foods
 */
const calculateTotalMacros = (meals = [], completedMeals = [], customFoods = []) => {
    let totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };

    // Add completed meals
    completedMeals.forEach(mealIndex => {
        const meal = meals[mealIndex];
        if (meal) {
            totals.calories += Number(meal.calories || meal.macros?.calories || 0);
            totals.protein += Number(meal.macros?.protein || meal.protein || 0);
            totals.carbs += Number(meal.macros?.carbs || meal.carbs || 0);
            totals.fats += Number(meal.macros?.fats || meal.fats || 0);
        }
    });

    // Add custom foods
    customFoods.forEach(food => {
        totals.calories += Number(food.calories || 0);
        totals.protein += Number(food.protein || 0);
        totals.carbs += Number(food.carbs || 0);
        totals.fats += Number(food.fats || 0);
    });

    return totals;
};

/**
 * Check for macro deficiencies
 * @param {Object} current - Current macros eaten
 * @param {Object} target - Target macros
 * @returns {Array} - Array of alerts
 */
export const getMacroAlerts = (current, target) => {
    if (!target || !current) return [];

    const alerts = [];
    const now = new Date();
    const hour = now.getHours();

    // Only alert if it's past noon and there's a significant deficit
    if (hour >= 12) {
        const percentageOfDay = (hour - 6) / 16; // 6am to 10pm range

        const expectedCalories = target.calories * percentageOfDay;
        const expectedProtein = target.protein * percentageOfDay;

        if (current.calories < expectedCalories * 0.7) {
            alerts.push({
                type: 'calories',
                severity: 'warning',
                message: `Vas bajo en calorías. Consumido: ${current.calories} / Esperado: ${Math.round(expectedCalories)}`
            });
        }

        if (current.protein < expectedProtein * 0.7) {
            alerts.push({
                type: 'protein',
                severity: 'high',
                message: `⚠️ Proteína baja. Consumido: ${current.protein}g / Esperado: ${Math.round(expectedProtein)}g`
            });
        }
    }

    // End of day check (after 8pm)
    if (hour >= 20) {
        const remaining = {
            calories: target.calories - current.calories,
            protein: target.protein - current.protein
        };

        if (remaining.protein > 30) {
            alerts.push({
                type: 'protein',
                severity: 'high',
                message: `Te faltan ${remaining.protein}g de proteína hoy. Considera un batido o snack proteico.`
            });
        }
    }

    return alerts;
};

/**
 * Get nutrition history for a user
 * @param {string} userId - User ID
 * @param {number} days - Number of days to fetch
 * @returns {Array} - Array of daily logs
 */
export const getNutritionHistory = async (userId, days = 7) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const logs = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            try {
                const log = await getDailyNutritionLog(userId, dateStr);
                logs.push(log);
            } catch (e) {
                // Skip days with no data
            }
        }

        return logs;

    } catch (error) {
        console.error('[NutritionService] Error getting history:', error);
        return [];
    }
};

/**
 * Get weekly nutrition stats
 * @param {string} userId - User ID
 * @returns {Object} - Weekly stats
 */
export const getWeeklyNutritionStats = async (userId) => {
    const history = await getNutritionHistory(userId, 7);

    if (history.length === 0) {
        return null;
    }

    const daysWithData = history.filter(h => h.completedMeals?.length > 0 || h.customFoods?.length > 0);

    if (daysWithData.length === 0) {
        return null;
    }

    const totals = daysWithData.reduce((acc, log) => ({
        calories: acc.calories + (log.totalMacros?.calories || 0),
        protein: acc.protein + (log.totalMacros?.protein || 0),
        carbs: acc.carbs + (log.totalMacros?.carbs || 0),
        fats: acc.fats + (log.totalMacros?.fats || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    return {
        days: daysWithData.length,
        averages: {
            calories: Math.round(totals.calories / daysWithData.length),
            protein: Math.round(totals.protein / daysWithData.length),
            carbs: Math.round(totals.carbs / daysWithData.length),
            fats: Math.round(totals.fats / daysWithData.length)
        },
        totals
    };
};

/**
 * Get all activities (extra cardio, etc) for the last 7 days
 * @param {string} userId - User ID
 * @returns {Array} - Array of activity objects
 */
export const getWeeklyActivities = async (userId) => {
    try {
        const history = await getNutritionHistory(userId, 7);
        const allActivities = [];

        history.forEach(log => {
            if (log.activities && Array.isArray(log.activities)) {
                log.activities.forEach(activity => {
                    allActivities.push({
                        ...activity,
                        date: log.date
                    });
                });
            }
        });

        return allActivities;
    } catch (error) {
        console.error('[NutritionService] Error getting weekly activities:', error);
        return [];
    }
};

/**
 * Get monthly nutrition stats
 * @param {string} userId - User ID
 * @returns {Object} - Monthly stats
 */
export const getMonthlyNutritionStats = async (userId) => {
    const history = await getNutritionHistory(userId, 30);

    if (history.length === 0) {
        return null;
    }

    const daysWithData = history.filter(h => h.completedMeals?.length > 0 || h.customFoods?.length > 0);

    if (daysWithData.length === 0) {
        return null;
    }

    const totals = daysWithData.reduce((acc, log) => ({
        calories: acc.calories + (log.totalMacros?.calories || 0),
        protein: acc.protein + (log.totalMacros?.protein || 0),
        carbs: acc.carbs + (log.totalMacros?.carbs || 0),
        fats: acc.fats + (log.totalMacros?.fats || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    return {
        days: daysWithData.length,
        averages: {
            calories: Math.round(totals.calories / daysWithData.length),
            protein: Math.round(totals.protein / daysWithData.length),
            carbs: Math.round(totals.carbs / daysWithData.length),
            fats: Math.round(totals.fats / daysWithData.length)
        },
        totals
    };
};
