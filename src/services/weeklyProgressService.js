/**
 * Weekly Progress Service
 * 
 * Servicio para calcular estadísticas semanales de nutrición y entrenamiento.
 * Refactorizado para máxima robustez procesando datos en memoria para evitar errores de índices.
 */

import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
 */
export const getWeeklyCalorieSummary = async (userId, targetCalories = 2000) => {
    if (!userId) return null;

    try {
        const weekDates = getWeekDates();
        const today = getLocalDateString();
        const firstDay = weekDates[0];
        const lastDay = weekDates[6];

        // 1. Logs de Nutrición
        const nutritionQuery = query(
            collection(db, 'nutritionLogs'),
            where('userId', '==', userId)
        );
        const nutritionSnap = await getDocs(nutritionQuery);
        const logsByDate = {};
        nutritionSnap.forEach(doc => {
            const data = doc.data();
            if (data.date >= firstDay && data.date <= lastDay) {
                logsByDate[data.date] = data;
            }
        });

        // 2. Entrenamientos
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
            if (weekDates.includes(dateStr)) {
                trainingDays.add(dateStr);
            }
        });

        // 3. Totales y Stats Diarias
        let totalDeficit = 0;
        let daysOnTarget = 0;
        let daysTracked = 0;

        const dailyStats = weekDates.map(date => {
            const log = logsByDate[date];
            const hasTraining = trainingDays.has(date);
            const consumed = Number(log?.totalMacros?.calories || 0);
            const activities = log?.activities || [];
            const burned = activities.reduce((sum, act) => sum + Number(act.caloriesBurned || 0), 0);
            const dayTarget = Math.round(Number(log?.targetMacros?.calories || targetCalories));

            const isTracked = (consumed > 0 || hasTraining) && date <= today;
            let isOnTarget = false;

            if (isTracked) {
                daysTracked++;
                const netCalories = consumed - burned;
                const deficit = dayTarget - netCalories;
                totalDeficit += deficit;

                if (netCalories <= dayTarget + 100 && netCalories >= dayTarget - 300) {
                    isOnTarget = true;
                    daysOnTarget++;
                }
            }

            return {
                date,
                isTracked,
                isOnTarget,
                hasTraining,
                isFuture: date > today
            };
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
        return {
            totalDeficit: 0,
            daysOnTarget: 0,
            daysTracked: 0,
            weekDates: getWeekDates(),
            dailyStats: getWeekDates().map(date => ({ date, isTracked: false, isOnTarget: false, isFuture: date > getLocalDateString() })),
            isDeficit: false
        };
    }
};

/**
 * Obtener el entrenamiento de hoy
 */
export const getTodayWorkout = async (userId) => {
    if (!userId) return null;

    try {
        const q = query(
            collection(db, 'workouts'),
            where('userId', '==', userId),
            where('status', '==', 'completed')
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        const workouts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        workouts.sort((a, b) => {
            const dateA = a.startTime?.toDate?.() || new Date(a.startTime);
            const dateB = b.startTime?.toDate?.() || new Date(b.startTime);
            return dateB - dateA;
        });

        const workout = workouts[0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
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
 */
export const getExerciseProgression = async (userId) => {
    if (!userId) return [];

    try {
        const q = query(
            collection(db, 'workouts'),
            where('userId', '==', userId),
            where('status', '==', 'completed')
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return [];

        const exerciseMap = {};
        snapshot.docs.forEach(doc => {
            const workout = doc.data();
            const workoutDate = workout.startTime?.toDate?.() || new Date(workout.startTime);

            (workout.exercises || []).forEach(ex => {
                (ex.loggedSets || []).forEach(set => {
                    if (!set.weight || set.weight <= 0) return;
                    const name = ex.name;
                    if (!exerciseMap[name]) exerciseMap[name] = [];
                    exerciseMap[name].push({ date: workoutDate, weight: set.weight, reps: set.reps });
                });
            });
        });

        const progressions = [];
        Object.entries(exerciseMap).forEach(([name, records]) => {
            if (records.length < 2) return;
            records.sort((a, b) => b.date - a.date);

            const now = new Date();
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);

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

        progressions.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
        return progressions.slice(0, 2);
    } catch (error) {
        console.error('[WeeklyProgress] Error getting progression:', error);
        return [];
    }
};

/**
 * Obtener resumen completo de progreso semanal
 */
export const getWeeklyProgressSummary = async (userId, targetCalories) => {
    try {
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
    } catch (error) {
        console.error('[WeeklyProgress] Error getting summary:', error);
        return null;
    }
};
