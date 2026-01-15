/**
 * Servicio de Tracking de Rutinas - FitAI
 * Maneja el progreso diario de rutinas y marca días como completados
 */

import { db } from '../config/firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';

/**
 * Obtiene el progreso semanal actual de la rutina activa
 */
export const getRoutineProgress = async (userId, routineId) => {
    try {
        const weekStart = getWeekStart();

        const q = query(
            collection(db, 'routineProgress'),
            where('userId', '==', userId),
            where('routineId', '==', routineId),
            where('weekStart', '==', Timestamp.fromDate(weekStart))
        );

        const snapshot = await getDocs(q);
        let progressData = null;

        if (!snapshot.empty) {
            const docData = snapshot.docs[0].data();
            progressData = {
                id: snapshot.docs[0].id,
                ...docData,
                weekStart: docData.weekStart?.toDate?.()?.toISOString?.() || weekStart.toISOString(),
                completedDays: docData.completedDays || []
            };
        } else {
            // Crear progreso base
            progressData = {
                userId,
                routineId,
                weekStart: weekStart.toISOString(),
                completedDays: [],
                totalWorkouts: 0
            };
        }

        // BACKFILL: Consultar la colección 'workouts' para asegurar que no falten días
        // Esto ayuda si el usuario completó entrenamientos pero no se marcó en routineProgress
        // IMPORTANTE: Solo contar entrenamientos COMPLETADOS, no abandonados
        const qWorkouts = query(
            collection(db, 'workouts'),
            where('userId', '==', userId),
            where('routineId', '==', routineId),
            where('status', '==', 'completed'), // Esto ya está correcto - solo 'completed', no 'abandoned'
            where('startTime', '>=', Timestamp.fromDate(weekStart))
        );

        const workoutSnap = await getDocs(qWorkouts);

        if (!workoutSnap.empty) {
            const workoutDays = workoutSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    dayIndex: data.dayIndex,
                    dayName: data.dayName,
                    completedAt: data.endTime || data.startTime,
                    isBackfilled: true
                };
            });

            // Combinar y eliminar duplicados por dayIndex
            const combined = [...progressData.completedDays];
            workoutDays.forEach(wd => {
                if (!combined.some(c => c.dayIndex === wd.dayIndex)) {
                    combined.push(wd);
                }
            });

            progressData.completedDays = combined;
            progressData.totalWorkouts = Math.max(progressData.totalWorkouts, combined.length);
        }

        return progressData;
    } catch (error) {
        console.error('[RoutineTracking] Error getting progress:', error);
        return {
            userId,
            routineId,
            weekStart: getWeekStart().toISOString(),
            completedDays: [],
            totalWorkouts: 0
        };
    }
};

/**
 * Marca un día como completado
 */
export const markDayAsCompleted = async (userId, routineId, dayIndex, dayName) => {
    try {
        const weekStart = getWeekStart();
        const weekKey = `${userId}_${routineId}_${weekStart.getTime()}`;

        const progressRef = doc(db, 'routineProgress', weekKey);
        const progressDoc = await getDoc(progressRef);

        const now = new Date();
        const completionRecord = {
            dayIndex,
            dayName,
            completedAt: Timestamp.fromDate(now),
            weekday: now.toLocaleDateString('es-ES', { weekday: 'long' })
        };

        if (progressDoc.exists()) {
            const data = progressDoc.data();
            const completedDays = data.completedDays || [];

            // No duplicar si ya está marcado esta semana
            const alreadyCompleted = completedDays.some(d =>
                d.dayIndex === dayIndex &&
                isThisWeek(d.completedAt?.toDate?.() || new Date(d.completedAt))
            );

            if (!alreadyCompleted) {
                completedDays.push(completionRecord);

                await setDoc(progressRef, {
                    ...data,
                    completedDays,
                    totalWorkouts: (data.totalWorkouts || 0) + 1,
                    lastUpdated: Timestamp.fromDate(now)
                }, { merge: true });
            }
        } else {
            // Crear nuevo documento
            await setDoc(progressRef, {
                userId,
                routineId,
                weekStart: Timestamp.fromDate(weekStart),
                completedDays: [completionRecord],
                totalWorkouts: 1,
                createdAt: Timestamp.fromDate(now),
                lastUpdated: Timestamp.fromDate(now)
            });
        }

        console.log('[RoutineTracking] Day marked as completed:', dayName);
        return true;
    } catch (error) {
        console.error('[RoutineTracking] Error marking day:', error);
        return false;
    }
};

/**
 * Verifica si un día específico fue completado esta semana
 */
export const isDayCompletedThisWeek = (completedDays, dayIndex) => {
    if (!completedDays || completedDays.length === 0) return false;

    return completedDays.some(day => {
        const completedAt = day.completedAt?.toDate?.() || new Date(day.completedAt);
        return day.dayIndex == dayIndex && isThisWeek(completedAt);
    });
};

/**
 * Obtiene el inicio de la semana actual (lunes)
 */
const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Lunes como inicio
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
};

/**
 * Verifica si una fecha está en la semana actual
 */
const isThisWeek = (date) => {
    const weekStart = getWeekStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    return date >= weekStart && date < weekEnd;
};

/**
 * Obtiene estadísticas del progreso semanal
 */
export const getWeeklyProgress = async (userId, routineId) => {
    const progress = await getRoutineProgress(userId, routineId);

    // Filtrar solo días completados esta semana
    const thisWeekDays = (progress.completedDays || []).filter(day => {
        const completedAt = day.completedAt?.toDate?.() || new Date(day.completedAt);
        return isThisWeek(completedAt);
    });

    return {
        totalCompleted: thisWeekDays.length,
        completedDays: thisWeekDays,
        uniqueDaysCompleted: [...new Set(thisWeekDays.map(d => d.dayIndex))],
        lastWorkout: thisWeekDays.length > 0
            ? thisWeekDays[thisWeekDays.length - 1].completedAt?.toDate?.()
            : null
    };
};

export default {
    getRoutineProgress,
    markDayAsCompleted,
    isDayCompletedThisWeek,
    getWeeklyProgress
};
