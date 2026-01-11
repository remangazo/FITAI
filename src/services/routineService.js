// Routine Service - CRUD operations for workout routines in Firestore
import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    writeBatch,
    orderBy,
    limit
} from 'firebase/firestore';

/**
 * Utilidad para limpiar objetos antes de enviar a Firestore
 * Remueve valores undefined que causan errores
 */
const sanitizeData = (data) => {
    return JSON.parse(JSON.stringify(data, (key, value) => {
        if (value === undefined) return null;
        return value;
    }));
};

/**
 * Save a new routine to Firestore
 * @param {string} userId - User ID
 * @param {Object} routineData - Routine data from AI generation
 * @returns {string} - Document ID of saved routine
 */
export const saveRoutine = async (userId, routineData) => {
    if (!userId) throw new Error('User ID is required');

    const sanitizedData = sanitizeData(routineData);

    const routineToSave = {
        ...sanitizedData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: false,
        status: 'draft' // draft | active | archived
    };

    const docRef = await addDoc(collection(db, 'routines'), routineToSave);
    return docRef.id;
};

/**
 * Get all routines for a user
 * @param {string} userId - User ID
 * @returns {Array} - Array of routines
 */
export const getUserRoutines = async (userId) => {
    if (!userId) return [];

    try {
        // Simple query without ordering to avoid index requirement
        const q = query(
            collection(db, 'routines'),
            where('userId', '==', userId)
        );

        const snapshot = await getDocs(q);
        const routines = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
            updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
        }));

        // Sort in memory instead
        return routines.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB - dateA;
        });
    } catch (error) {
        console.error('[RoutineService] Error getting user routines:', error);
        return [];
    }
};

/**
 * Get the active routine for a user
 * @param {string} userId - User ID
 * @returns {Object|null} - Active routine or null
 */
export const getActiveRoutine = async (userId) => {
    if (!userId) return null;

    try {
        // Get all routines and filter in memory to avoid composite index
        const routines = await getUserRoutines(userId);
        const activeRoutine = routines.find(r => r.isActive === true);
        return activeRoutine || null;
    } catch (error) {
        console.error('[RoutineService] Error getting active routine:', error);
        return null;
    }
};

/**
 * Activate a routine (and deactivate all others for the user)
 * @param {string} routineId - Routine ID to activate
 * @param {string} userId - User ID
 */
export const activateRoutine = async (routineId, userId) => {
    if (!routineId || !userId) throw new Error('Routine ID and User ID are required');

    // Get all user routines
    const routines = await getUserRoutines(userId);

    // Create batch operation
    const batch = writeBatch(db);

    // Deactivate all routines
    routines.forEach(routine => {
        const routineRef = doc(db, 'routines', routine.id);
        const updateObj = routine.id === routineId
            ? {
                isActive: true,
                status: 'active',
                updatedAt: new Date()
            }
            : {
                isActive: false,
                status: routine.status === 'active' ? 'archived' : routine.status,
                updatedAt: new Date()
            };

        // Sanitizar antes de actualizar por si acaso
        batch.update(routineRef, sanitizeData(updateObj));
    });

    // Commit batch
    await batch.commit();
};

/**
 * Update a routine
 * @param {string} routineId - Routine ID
 * @param {Object} updates - Fields to update
 */
export const updateRoutine = async (routineId, updates) => {
    if (!routineId) throw new Error('Routine ID is required');

    const routineRef = doc(db, 'routines', routineId);
    await updateDoc(routineRef, {
        ...updates,
        updatedAt: new Date()
    });
};

/**
 * Delete a routine
 * @param {string} routineId - Routine ID
 */
export const deleteRoutine = async (routineId) => {
    if (!routineId) throw new Error('Routine ID is required');

    const routineRef = doc(db, 'routines', routineId);
    await deleteDoc(routineRef);
};

/**
 * Save a routine and optionally activate it
 * @param {string} userId - User ID
 * @param {Object} routineData - Routine data
 * @param {boolean} activate - Whether to activate immediately
 * @returns {string} - Document ID
 */
export const saveAndActivateRoutine = async (userId, routineData, activate = false) => {
    try {
        console.log('[RoutineService] Saving routine for user:', userId);
        console.log('[RoutineService] Routine data:', routineData);

        const routineId = await saveRoutine(userId, routineData);
        console.log('[RoutineService] Routine saved with ID:', routineId);

        if (activate) {
            console.log('[RoutineService] Activating routine...');
            await activateRoutine(routineId, userId);
            console.log('[RoutineService] Routine activated successfully');
        }

        return routineId;
    } catch (error) {
        console.error('[RoutineService] Error in saveAndActivateRoutine:', error);
        console.error('[RoutineService] Error details:', error.message);
        if (error.code) {
            console.error('[RoutineService] Error code:', error.code);
        }
        throw error;
    }
};
