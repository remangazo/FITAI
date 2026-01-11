/**
 * Servicio de Validación de Datos - FitAI
 * Asegura calidad y consistencia en inputs del usuario y outputs del sistema
 */

// ===== VALIDACIÓN DE INPUTS DEL USUARIO =====

/**
 * Valida y sanitiza el perfil completo del usuario
 */
export const validateUserProfile = (profile) => {
    const errors = [];
    const warnings = [];
    const sanitized = { ...profile };

    // === DATOS BÁSICOS ===

    // Peso (30-300 kg)
    if (profile.weight) {
        const weight = parseFloat(profile.weight);
        if (isNaN(weight) || weight < 30 || weight > 300) {
            errors.push("Peso debe estar entre 30 y 300 kg");
        } else {
            sanitized.weight = weight;
        }
    } else {
        errors.push("Peso es obligatorio");
    }

    // Altura (100-250 cm)
    if (profile.height) {
        const height = parseFloat(profile.height);
        if (isNaN(height) || height < 100 || height > 250) {
            errors.push("Altura debe estar entre 100 y 250 cm");
        } else {
            sanitized.height = height;
        }
    } else {
        errors.push("Altura es obligatoria");
    }

    // Edad (15-100 años)
    if (profile.birthYear) {
        const year = parseInt(profile.birthYear);
        const age = new Date().getFullYear() - year;
        if (isNaN(age) || age < 15 || age > 100) {
            errors.push("Edad debe estar entre 15 y 100 años");
        } else {
            sanitized.age = age;
        }
    }

    // Género
    const validGenders = ['male', 'female', 'masculino', 'femenino', 'm', 'f'];
    if (!validGenders.includes(profile.gender?.toLowerCase())) {
        errors.push("Género debe ser masculino o femenino");
    }

    // === OBJETIVOS ===

    const validGoals = ['muscle', 'strength', 'weight_loss', 'endurance', 'mobility'];

    if (!profile.primaryGoal || !validGoals.includes(profile.primaryGoal)) {
        errors.push("Objetivo primario inválido");
    }

    if (profile.secondaryGoals && !Array.isArray(profile.secondaryGoals)) {
        warnings.push("Objetivos secundarios deben ser un array");
        sanitized.secondaryGoals = [];
    }

    // === EXPERIENCIA ===

    if (profile.experienceYears !== undefined) {
        const years = parseInt(profile.experienceYears);
        if (isNaN(years) || years < 0 || years > 50) {
            warnings.push("Años de experiencia fuera de rango, usando 0");
            sanitized.experienceYears = 0;
        } else {
            sanitized.experienceYears = years;
        }
    }

    // === BENCHMARKS DE FUERZA ===

    // Solo validar si el usuario tiene experiencia
    if (sanitized.experienceYears > 0) {
        // Press Banca (20-300 kg)
        if (profile.benchmarkBenchPress) {
            const bench = parseFloat(profile.benchmarkBenchPress);
            if (isNaN(bench) || bench < 20 || bench > 300) {
                warnings.push("Benchmark de press banca fuera de rango (20-300kg)");
                sanitized.benchmarkBenchPress = null;
            } else {
                // Validar ratio vs peso corporal (máximo 3x)
                const ratio = bench / sanitized.weight;
                if (ratio > 3.0) {
                    warnings.push("Press banca muy alto vs peso corporal, verificar");
                }
                sanitized.benchmarkBenchPress = bench;
            }
        }

        // Sentadilla (30-400 kg)
        if (profile.benchmarkSquat) {
            const squat = parseFloat(profile.benchmarkSquat);
            if (isNaN(squat) || squat < 30 || squat > 400) {
                warnings.push("Benchmark de sentadilla fuera de rango (30-400kg)");
                sanitized.benchmarkSquat = null;
            } else {
                const ratio = squat / sanitized.weight;
                if (ratio > 4.0) {
                    warnings.push("Sentadilla muy alta vs peso corporal, verificar");
                }
                sanitized.benchmarkSquat = squat;
            }
        }

        // Peso Muerto (40-500 kg)
        if (profile.benchmarkDeadlift) {
            const deadlift = parseFloat(profile.benchmarkDeadlift);
            if (isNaN(deadlift) || deadlift < 40 || deadlift > 500) {
                warnings.push("Benchmark de peso muerto fuera de rango (40-500kg)");
                sanitized.benchmarkDeadlift = null;
            } else {
                const ratio = deadlift / sanitized.weight;
                if (ratio > 4.5) {
                    warnings.push("Peso muerto muy alto vs peso corporal, verificar");
                }
                sanitized.benchmarkDeadlift = deadlift;
            }
        }

        // Dominadas (0-50 reps)
        if (profile.benchmarkPullups) {
            const pullups = parseInt(profile.benchmarkPullups);
            if (isNaN(pullups) || pullups < 0 || pullups > 50) {
                warnings.push("Benchmark de dominadas fuera de rango (0-50)");
                sanitized.benchmarkPullups = null;
            } else {
                sanitized.benchmarkPullups = pullups;
            }
        }
    }

    // === DISPONIBILIDAD ===

    const validDays = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

    if (!profile.availableDays || !Array.isArray(profile.availableDays)) {
        warnings.push("Días disponibles no especificados, usando default");
        sanitized.availableDays = ['lunes', 'miercoles', 'viernes'];
    } else {
        sanitized.availableDays = profile.availableDays.filter(d =>
            validDays.includes(d.toLowerCase())
        );

        if (sanitized.availableDays.length < 2) {
            warnings.push("Mínimo 2 días de entrenamiento recomendados");
        }
        if (sanitized.availableDays.length > 6) {
            warnings.push("Máximo 6 días de entrenamiento, día de descanso necesario");
            sanitized.availableDays = sanitized.availableDays.slice(0, 6);
        }
    }

    // === EQUIPO ===

    const validEquipment = [
        'barra', 'mancuernas', 'banco', 'rack', 'discos', 'peso_corporal',
        'polea', 'cable', 'maquina_prensa', 'maquina_curl', 'barra_dominadas',
        'paralelas', 'barra_ez', 'maquina_gemelos'
    ];

    if (!profile.availableEquipment || !Array.isArray(profile.availableEquipment)) {
        warnings.push("Equipo no especificado, usando peso corporal");
        sanitized.availableEquipment = ['peso_corporal'];
    } else {
        sanitized.availableEquipment = profile.availableEquipment.filter(eq =>
            validEquipment.includes(eq.toLowerCase())
        );

        // Siempre agregar peso corporal
        if (!sanitized.availableEquipment.includes('peso_corporal')) {
            sanitized.availableEquipment.push('peso_corporal');
        }
    }

    // === LESIONES ===

    if (profile.injuries && typeof profile.injuries === 'string') {
        // Convertir string a array
        sanitized.injuries = profile.injuries
            .toLowerCase()
            .split(',')
            .map(i => i.trim())
            .filter(i => i.length > 0);
    } else if (Array.isArray(profile.injuries)) {
        sanitized.injuries = profile.injuries;
    } else {
        sanitized.injuries = [];
    }

    // === DEBILIDADES ===

    if (profile.knownWeaknesses && !Array.isArray(profile.knownWeaknesses)) {
        sanitized.knownWeaknesses = [];
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitized
    };
};

// ===== VALIDACIÓN DE OUTPUTS DEL SISTEMA =====

/**
 * Valida rutina generada antes de entregar al usuario
 */
export const validateRoutineOutput = (routine, userProfile) => {
    const errors = [];
    const warnings = [];

    // === ESTRUCTURA BÁSICA ===

    if (!routine || typeof routine !== 'object') {
        errors.push("Rutina inválida: no es un objeto");
        return { isValid: false, errors, warnings };
    }

    if (!routine.weeklyRoutine || typeof routine.weeklyRoutine !== 'object') {
        errors.push("Rutina sin días de entrenamiento");
    }

    // === VALIDAR CADA DÍA ===

    const days = Object.keys(routine.weeklyRoutine || {});

    if (days.length === 0) {
        errors.push("Rutina sin días definidos");
    } else if (days.length < 2) {
        warnings.push("Solo 1 día de entreno, mínimo 2 recomendado");
    } else if (days.length > 6) {
        warnings.push("Más de 6 días sin descanso no es recomendable");
    }

    days.forEach(day => {
        const dayWorkout = routine.weeklyRoutine[day];

        // Validar estructura del día
        if (!dayWorkout.exercises || !Array.isArray(dayWorkout.exercises)) {
            errors.push(`Día ${day}: sin ejercicios`);
            return;
        }

        // Validar cantidad de ejercicios
        if (dayWorkout.exercises.length < 3) {
            warnings.push(`Día ${day}: muy pocos ejercicios (${dayWorkout.exercises.length})`);
        } else if (dayWorkout.exercises.length > 10) {
            warnings.push(`Día ${day}: demasiados ejercicios (${dayWorkout.exercises.length}), podría ser excesivo`);
        }

        // Validar cada ejercicio
        dayWorkout.exercises.forEach((ex, i) => {
            if (!ex.name) {
                errors.push(`Día ${day}, ejercicio ${i + 1}: sin nombre`);
            }

            if (!ex.sets || ex.sets < 1 || ex.sets > 10) {
                warnings.push(`Día ${day}, ${ex.name}: sets inválidos (${ex.sets})`);
            }

            if (!ex.rest || ex.rest < 10 || ex.rest > 600) {
                warnings.push(`Día ${day}, ${ex.name}: descanso inválido (${ex.rest}s)`);
            }
        });

        // Validar volumen total del día (40-80 sets recomendado)
        const totalSets = dayWorkout.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
        if (totalSets < 10) {
            warnings.push(`Día ${day}: volumen muy bajo (${totalSets} sets)`);
        } else if (totalSets > 40) {
            warnings.push(`Día ${day}: volumen muy alto (${totalSets} sets), riesgo de sobreentrenamiento`);
        }
    });

    // === VALIDAR FRECUENCIA ===

    if (routine.frequency) {
        if (routine.frequency !== days.length) {
            warnings.push(`Frecuencia declarada (${routine.frequency}) no coincide con días (${days.length})`);
        }
    }

    // === VALIDAR PROGRESIÓN ===

    if (routine.level) {
        const validLevels = ['beginner', 'intermediate', 'advanced'];
        if (!validLevels.includes(routine.level)) {
            warnings.push(`Nivel inválido: ${routine.level}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        stats: {
            totalDays: days.length,
            totalExercises: days.reduce((sum, day) =>
                sum + (routine.weeklyRoutine[day].exercises?.length || 0), 0
            ),
            avgExercisesPerDay: (days.reduce((sum, day) =>
                sum + (routine.weeklyRoutine[day].exercises?.length || 0), 0
            ) / days.length).toFixed(1)
        }
    };
};

/**
 * Valida plan nutricional antes de entregar
 */
export const validateNutritionOutput = (nutrition, metabolicProfile) => {
    const errors = [];
    const warnings = [];

    if (!nutrition || !nutrition.weeklyPlan) {
        errors.push("Plan nutricional inválido");
        return { isValid: false, errors, warnings };
    }

    const days = Object.keys(nutrition.weeklyPlan);

    if (days.length !== 7) {
        warnings.push(`Plan nutricional debería tener 7 días, tiene ${days.length}`);
    }

    days.forEach(day => {
        const dayMeals = nutrition.weeklyPlan[day];

        if (!Array.isArray(dayMeals)) {
            errors.push(`Día ${day}: comidas no son un array`);
            return;
        }

        // Validar mínimo de comidas
        if (dayMeals.length < 3) {
            warnings.push(`Día ${day}: menos de 3 comidas (${dayMeals.length})`);
        }

        // Validar calorías totales del día
        const totalCalories = dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        const targetCalories = metabolicProfile?.metabolism?.targetCalories || 2000;

        const difference = Math.abs(totalCalories - targetCalories);
        const percentDiff = (difference / targetCalories) * 100;

        if (percentDiff > 10) {
            warnings.push(`Día ${day}: calorías totales (${totalCalories}) difieren ${percentDiff.toFixed(0)}% del objetivo (${targetCalories})`);
        }

        // Validar cada comida
        dayMeals.forEach((meal, i) => {
            if (!meal.name) {
                warnings.push(`Día ${day}, comida ${i + 1}: sin nombre`);
            }

            if (!meal.calories || meal.calories < 50 || meal.calories > 1500) {
                warnings.push(`Día ${day}, ${meal.name}: calorías inválidas (${meal.calories})`);
            }

            if (meal.macros) {
                const { protein, carbs, fats } = meal.macros;
                const calculatedCals = (protein * 4) + (carbs * 4) + (fats * 9);
                const diff = Math.abs(calculatedCals - meal.calories);

                if (diff > meal.calories * 0.15) {
                    warnings.push(`Día ${day}, ${meal.name}: macros no coinciden con calorías`);
                }
            }
        });
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

// ===== HELPERS =====

/**
 * Log de validación para debugging
 */
export const logValidation = (validationResult, context = "") => {
    if (!validationResult.isValid) {
        console.error(`❌ Validación FALLIDA - ${context}`);
        console.error("Errores:", validationResult.errors);
    }

    if (validationResult.warnings?.length > 0) {
        console.warn(`⚠️ Advertencias - ${context}`);
        console.warn(validationResult.warnings);
    }

    if (validationResult.isValid && validationResult.warnings?.length === 0) {
        console.log(`✅ Validación EXITOSA - ${context}`);
    }
};

export default {
    validateUserProfile,
    validateRoutineOutput,
    validateNutritionOutput,
    logValidation
};
