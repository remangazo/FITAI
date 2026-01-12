/**
 * Weekly Progress Service
 * 
 * Servicio para calcular estadísticas semanales de nutrición y entrenamiento.
 */

import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getLocalDateString, getWeekStart } from '../utils/dateUtils';
import { getWeeklyStats } from './workoutService';

/**
 * Obtener array de fechas de la semana actual
 */
const getWeekDates = () => {
    const weekStart = getWeekStart();
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        dates.push(getLocalDateString(d));
    }
    return dates;
};

/**
 * Obtener resumen semanal de calorías
 * @param {string} userId - ID del usuario
 * @param {number} targetCalories - Calorías objetivo diarias
 * @returns {Object} Resumen semanal
 */
export const getWeeklyCalorieSummary = async (userId, targetCalories = 2000) => {
    if (!userId) return null;

    try {
        const weekDates = getWeekDates();
        const today = getLocalDateString();

        // 1. Obtener entrenamientos completados del usuario (pocos documentos, filtrado manual seguro)
        const workoutsQuery = query(
            collection(db, 'workouts'),
            where('userId', '==', userId),
            where('status', '==', 'completed')
        );
        const workoutsSnap = await getDocs(workoutsQuery);
        const trainingDays = new Set();
        workoutsSnap.forEach(doc => {
            const data = doc.data();
            const date = data.startTime?.toDate?.() || new Date(data.startTime);
            const dateStr = getLocalDateString(date);
            trainingDays.add(dateStr);
        });

        // 2. Obtener logs de nutrición (usando bucle para evitar problemas de índice compuesto)
        let totalDeficit = 0;
        let daysOnTarget = 0;
        let daysTracked = 0;

        const dailyStatsPromises = weekDates.map(async (date) => {
            const isFuture = date > today;
            let log = null;

            if (!isFuture) {
                const q = query(
                    collection(db, 'nutritionLogs'),
                    where('userId', '==', userId),
                    where('date', '==', date)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    log = querySnapshot.docs[0].data();
                }
            }

            const hasTraining = trainingDays.has(date);
            const consumed = log?.totalMacros?.calories || 0;
            const activities = log?.activities || [];
            const burned = activities.reduce((sum, act) => sum + (act.caloriesBurned || 0), 0);
            const dayTarget = Math.round(log?.targetMacros?.calories || targetCalories);

            const isTracked = (consumed > 0 || hasTraining) && !isFuture;
            let isOnTarget = false;

            if (isTracked) {
                const netCalories = consumed - burned;
                if (netCalories <= dayTarget + 100 && netCalories >= dayTarget - 300) {
                    isOnTarget = true;
                }
            }

            return {
                date,
                isTracked,
                isOnTarget,
                hasTraining,
                isFuture,
                deficit: isTracked ? (dayTarget - (consumed - burned)) : 0
            };
        });

        const dailyStats = await Promise.all(dailyStatsPromises);

        // Calcular totales finales
        dailyStats.forEach(stat => {
            if (stat.isTracked) {
                daysTracked++;
                totalDeficit += stat.deficit;
                if (stat.isOnTarget) daysOnTarget++;
            }
        });

        return {
            totalDeficit: Math.round(totalDeficit),
            daysOnTarget,
            daysTracked,
            weekDates,
            dailyStats,
            isDeficit: totalDeficit > 0
        };
    } catch (error) {
        console.error('[WeeklyProgress] Error getting calorie summary:', error);
        return null;
    }
};

/**
 * Obtener el entrenamiento de hoy
 * @param {string} userId - ID del usuario
 * @returns {Object|null} Entrenamiento de hoy o null
 */
export const getTodayWorkout = async (userId) => {
    if (!userId) return null;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const q = query(
            collection(db, 'workouts'),
            where('userId', '==', userId),
            where('status', '==', 'completed'),
            orderBy('startTime', 'desc'),
            limit(1)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        const workout = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
        };

        // Verificar si es de hoy
        const workoutDate = workout.startTime?.toDate?.() || new Date(workout.startTime);
        if (workoutDate >= today) {
            return {
                dayName: workout.dayName || workout.dayFocus || 'Entrenamiento',
                duration: workout.duration || 0,
                totalVolume: workout.totalVolume || 0,
                totalSets: workout.totalSets || 0,
                caloriesBurned: workout.caloriesBurned || Math.round(0.08 * 70 * (workout.duration || 0))
            };
        }

        return null;
    } catch (error) {
        console.error('[WeeklyProgress] Error getting today workout:', error);
        return null;
    }
};

/**
 * Obtener progresión de ejercicios principales
 * @param {string} userId - ID del usuario
 * @returns {Array} Lista de progresiones
 */
export const getExerciseProgression = async (userId) => {
    if (!userId) return [];

    try {
        // Obtener los últimos 14 días de entrenamientos
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const q = query(
            collection(db, 'workouts'),
            where('userId', '==', userId),
            where('status', '==', 'completed'),
            orderBy('startTime', 'desc'),
            limit(20)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return [];

        // Agrupar ejercicios por nombre
        const exerciseMap = {};

        snapshot.docs.forEach(doc => {
            const workout = doc.data();
            const workoutDate = workout.startTime?.toDate?.() || new Date(workout.startTime);

            (workout.exercises || []).forEach(ex => {
                (ex.loggedSets || []).forEach(set => {
                    if (!set.weight || set.weight <= 0) return;

                    const name = ex.name;
                    if (!exerciseMap[name]) {
                        exerciseMap[name] = [];
                    }
                    exerciseMap[name].push({
                        date: workoutDate,
                        weight: set.weight,
                        reps: set.reps
                    });
                });
            });
        });

        // Calcular progresión para cada ejercicio
        const progressions = [];
        Object.entries(exerciseMap).forEach(([name, records]) => {
            if (records.length < 2) return;

            // Ordenar por fecha
            records.sort((a, b) => b.date - a.date);

            // Obtener el mejor peso de la última semana vs anterior
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const thisWeek = records.filter(r => r.date >= oneWeekAgo);
            const lastWeek = records.filter(r => r.date < oneWeekAgo);

            if (thisWeek.length === 0 || lastWeek.length === 0) return;

            const currentBest = Math.max(...thisWeek.map(r => r.weight));
            const previousBest = Math.max(...lastWeek.map(r => r.weight));

            if (previousBest > 0) {
                const change = ((currentBest - previousBest) / previousBest) * 100;
                progressions.push({
                    name,
                    currentWeight: currentBest,
                    previousWeight: previousBest,
                    changePercent: change.toFixed(1),
                    improved: change > 0
                });
            }
        });

        // Ordenar por mayor mejora y tomar los top 2
        progressions.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
        return progressions.slice(0, 2);

    } catch (error) {
        console.error('[WeeklyProgress] Error getting exercise progression:', error);
        return [];
    }
};

/**
 * Obtener resumen completo de progreso semanal
 */
export const getWeeklyProgressSummary = async (userId, targetCalories) => {
    const [calorieSummary, todayWorkout, exerciseProgression, trainingStats] = await Promise.all([
        getWeeklyCalorieSummary(userId, targetCalories),
        getTodayWorkout(userId),
        getExerciseProgression(userId),
        getWeeklyStats(userId)
    ]);

    return {
        calories: calorieSummary,
        todayWorkout,
        progression: exerciseProgression,
        training: trainingStats
    };
};
