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
 * Obtener el inicio de la semana actual (lunes) en hora local
 */
export const getWeekStart = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    // Monday as 1, Sunday as 7. If Sunday (0), we need to go back 6 days.
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    d.setDate(diff);
    return d;
};

/**
 * Get weekday name in Spanish
 */
export const getDayName = (date = new Date()) => {
    const name = date.toLocaleDateString('es-ES', { weekday: 'long' });
    return name.charAt(0).toUpperCase() + name.slice(1);
};
