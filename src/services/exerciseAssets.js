/**
 * Exercise Assets Service - FitAI
 * 
 * Provides mapping for exercise names to machine images and reference resources.
 */

// Mapping of exercise keywords to high-quality reference images (Placeholders for now)
const EXERCISE_IMAGES = {
    'press banca': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400',
    'sentadilla': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=400',
    'prensa': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400',
    'remo': 'https://images.unsplash.com/photo-1590239098509-e010d56fc43c?auto=format&fit=crop&q=80&w=400',
    'jalon': 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&q=80&w=400',
    'militar': 'https://images.unsplash.com/photo-1541534741688-6078c64b5903?auto=format&fit=crop&q=80&w=400',
    'curl': 'https://images.unsplash.com/photo-1581009146145-b5ef03a7403f?auto=format&fit=crop&q=80&w=400',
    'triceps': 'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?auto=format&fit=crop&q=80&w=400',
    'gemelo': 'https://images.unsplash.com/photo-1590239098509-e010d56fc43c?auto=format&fit=crop&q=80&w=400',
    'extension': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400',
    'plancha': 'https://images.unsplash.com/photo-1566241142559-40e1bfc26cc7?auto=format&fit=crop&q=80&w=400',
    'abdominal': 'https://images.unsplash.com/photo-1519034841976-7484b7117770?auto=format&fit=crop&q=80&w=400',
    'core': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=400',
    'oblicuo': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400',
    'pierna': 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&q=80&w=400',
};

/**
 * Gets a reference image URL for an exercise name
 * @param {string} exerciseName 
 * @returns {string|null}
 */
export const getExerciseImage = (exerciseName) => {
    if (!exerciseName) return null;
    const name = exerciseName.toLowerCase();

    // Find first matching keyword
    for (const [key, url] of Object.entries(EXERCISE_IMAGES)) {
        if (name.includes(key)) return url;
    }

    // Generic placeholder if no match
    return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400';
};

/**
 * Gets the machine category icon name
 */
export const getEquipmentIcon = (exerciseName) => {
    const name = (exerciseName || '').toLowerCase();
    if (name.includes('máquina') || name.includes('machine') || name.includes('prensa') || name.includes('peck deck')) {
        return 'Settings';
    }
    if (name.includes('mancuerna') || name.includes('dumbbell')) {
        return 'Dumbbell';
    }
    if (name.includes('barra') || name.includes('barbell') || name.includes('smith')) {
        return 'Minimize2'; // Barbell-ish
    }
    if (name.includes('kettlebell')) {
        return 'Target';
    }
    if (name.includes('peso corporal') || name.includes('bodyweight')) {
        return 'User';
    }
    return 'Activity';
};

export default {
    getExerciseImage,
    getEquipmentIcon
};
