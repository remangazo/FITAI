/**
 * Date Utilities for FitAI
 */

/**
 * Get current date in local YYYY-MM-DD format
 * Prevents timezone issues where UTC date is different from local date
 */
export const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get weekday name in Spanish
 */
export const getDayName = (date = new Date()) => {
    const name = date.toLocaleDateString('es-ES', { weekday: 'long' });
    return name.charAt(0).toUpperCase() + name.slice(1);
};
