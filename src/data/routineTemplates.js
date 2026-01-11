/**
 * Templates de Rutinas - FitAI
 * Basados en ejemplos del usuario y estándares profesionales
 */

export const ROUTINE_TEMPLATES = {
    // ===== PRINCIPIANTE ===== (3 días/semana, Full Body)

    beginner_hypertrophy: {
        id: "beginner_hypertrophy",
        level: "beginner",
        goal: "hypertrophy",
        trainingStyle: "full_body",
        frequency: 3,
        details: {
            sets: [3, 3],              // Rango 3-3 sets
            reps: [8, 12],             // Rango 8-12 reps
            rest: 90,                  // 90 segundos
            notes: "Bases musculares. Aumenta peso si 12 reps son fáciles."
        },
        structure: {
            main: {
                categories: ["legs_quad", "push_horizontal", "pull_horizontal", "push_vertical"],
                primaryCount: 4,       // 4 ejercicios primarios
                secondaryCount: 2      // 2 accesorios
            },
            abs: {
                exercises: 3,
                circuits: 2
            }
        }
    },

    beginner_fat_loss: {
        id: "beginner_fat_loss",
        level: "beginner",
        goal: "fat_loss",
        trainingStyle: "full_body",
        frequency: 3,
        details: {
            sets: [3, 3],
            reps: [12, 15],
            rest: 60,
            notes: "Formato circuito para elevar pulso. 10 min cardio post-entreno."
        },
        structure: {
            main: {
                categories: ["legs", "push", "pull", "core"],
                primaryCount: 4,
                secondaryCount: 2
            },
            cardio: {
                duration: 10,
                type: "moderate"
            },
            abs: {
                exercises: 3,
                circuits: 3
            }
        }
    },

    beginner_strength: {
        id: "beginner_strength",
        level: "beginner",
        goal: "strength",
        training Style: "full_body",
        frequency: 3,
        details: {
            sets: [3, 3],
            reps: [4, 6],
            rest: 180,                 // 2-3 min
            notes: "Pesos ligeros al inicio para perfeccionar la forma."
        },
        structure: {
            main: {
                categories: ["legs_quad", "push_horizontal", "pull_horizontal", "push_vertical", "pull_posterior"],
                primaryCount: 5,       // Solo compuestos
                secondaryCount: 0
            },
            abs: {
                exercises: 3,
                circuits: 2
            }
        }
    },

    // ===== INTERMEDIO ===== (4 días/semana, Upper/Lower Split)

    intermediate_hypertrophy: {
        id: "intermediate_hypertrophy",
        level: "intermediate",
        goal: "hypertrophy",
        trainingStyle: "upper_lower",
        frequency: 4,
        details: {
            sets: [3, 4],
            reps: [8, 12],
            rest: 105,                 // 90-120s promedio
            notes: "Alterna grips y ángulos semanalmente."
        },
        structure: {
            upper: {
                categories: ["push_horizontal", "pull_vertical", "push_vertical", "pull_arms", "push_arms"],
                primaryCount: 2,
                secondaryCount: 3
            },
            lower: {
                categories: ["legs_quad", "legs_hamstring", "legs_calf"],
                primaryCount: 2,
                secondaryCount: 2
            },
            abs: {
                allDays: true,
                exercises: 3,
                circuits: 3
            }
        }
    },

    intermediate_fat_loss: {
        id: "intermediate_fat_loss",
        level: "intermediate",
        goal: "fat_loss",
        trainingStyle: "upper_lower",
        frequency: 4,
        details: {
            sets: [3, 4],
            reps: [12, 15],
            rest: 52,                  // 45-60s promedio
            notes: "Superseries para mantener pulso elevado."
        },
        structure: {
            upper: {
                categories: ["push", "pull"],
                primaryCount: 2,
                secondaryCount: 3,
                supersets: true
            },
            lower: {
                categories: ["legs_quad", "legs_hamstring"],
                primaryCount: 2,
                secondaryCount: 2,
                supersets: true
            },
            cardio: {
                duration: 15,
                type: "HIIT"
            },
            abs: {
                allDays: true,
                exercises: 3,
                circuits: 3
            }
        }
    },

    intermediate_strength: {
        id: "intermediate_strength",
        level: "intermediate",
        goal: "strength",
        trainingStyle: "upper_lower",
        frequency: 4,
        details: {
            sets: [4, 4],
            reps: [4, 6],
            rest: 180,
            notes: "Explosividad en levantamientos."
        },
        structure: {
            upper: {
                categories: ["push_horizontal", "pull_vertical", "push_vertical"],
                primaryCount: 3,
                secondaryCount: 0
            },
            lower: {
                categories: ["pull_posterior", "legs_quad"],
                primaryCount: 2,
                secondaryCount: 1
            },
            abs: {
                allDays: true,
                exercises: 3,
                circuits: 2
            }
        }
    },

    // ===== AVANZADO ===== (5-6 días/semana, Push-Pull-Legs Split)

    advanced_hypertrophy: {
        id: "advanced_hypertrophy",
        level: "advanced",
        goal: "hypertrophy",
        trainingStyle: "ppl",
        frequency: 6,
        details: {
            sets: [4, 4],
            reps: [8, 12],
            rest: 90,
            techniques: ["dropsets"],
            notes: "+1 dropset en última serie. Variar ángulos semanalmente."
        },
        structure: {
            push: {
                categories: ["push_horizontal", "push_vertical", "push_arms"],
                primaryCount: 2,
                secondaryCount: 2
            },
            pull: {
                categories: ["pull_posterior", "pull_vertical", "pull_horizontal", "pull_arms"],
                primaryCount: 2,
                secondaryCount: 2
            },
            legs: {
                categories: ["legs_quad", "legs_hamstring", "legs_calf"],
                primaryCount: 2,
                secondaryCount: 2
            },
            abs: {
                allDays: true,
                exercises: 3,
                circuits: 3
            }
        }
    },

    advanced_fat_loss: {
        id: "advanced_fat_loss",
        level: "advanced",
        goal: "fat_loss",
        trainingStyle: "ppl",
        frequency: 6,
        details: {
            sets: [4, 4],
            reps: [12, 15],
            rest: 37,                  // 30-45s promedio
            notes: "Formato circuito. 20 min cardio post-entreno."
        },
        structure: {
            push: {
                categories: ["push_horizontal", "push_vertical", "push_arms"],
                primaryCount: 1,
                secondaryCount: 3,
                circuit: true
            },
            pull: {
                categories: ["pull_vertical", "pull_horizontal", "pull_arms"],
                primaryCount: 1,
                secondaryCount: 3,
                circuit: true
            },
            legs: {
                categories: ["legs_unilateral", "legs_hamstring", "legs_calf"],
                primaryCount: 1,
                secondaryCount: 3,
                circuit: true
            },
            cardio: {
                duration: 20,
                type: "moderate"
            },
            abs: {
                allDays: true,
                exercises: 3,
                circuits: 4
            }
        }
    },

    advanced_strength: {
        id: "advanced_strength",
        level: "advanced",
        goal: "strength",
        trainingStyle: "ppl",
        frequency: 6,
        details: {
            sets: [5, 5],
            reps: [3, 5],
            rest: 210,                 // 3-4 min promedio
            techniques: ["pause_reps"],
            notes: "Pausas en rango bajo para tensión. Explosividad."
        },
        structure: {
            push: {
                categories: ["push_horizontal", "push_vertical"],
                primaryCount: 3,
                secondaryCount: 0
            },
            pull: {
                categories: ["pull_posterior", "pull_vertical", "pull_arms"],
                primaryCount: 3,
                secondaryCount: 0
            },
            legs: {
                categories: ["legs_quad", "legs_hamstring"],
                primaryCount: 3,
                secondaryCount: 0
            },
            abs: {
                allDays: true,
                exercises: 3,
                circuits: 2
            }
        }
    }
};

/**
 * Selecciona template según perfil
 */
export const selectTemplate = (level, goal) => {
    const templateId = `${level}_${goal}`;
    return ROUTINE_TEMPLATES[templateId] || ROUTINE_TEMPLATES.beginner_hypertrophy;
};

/**
 * Obtiene días de entrenamiento según split
 */
export const getTrainingDays = (trainingStyle, frequency, availableDays) => {
    const splitMappings = {
        full_body: {
            3: ["lunes", "miercoles", "viernes"],
            4: ["lunes", "martes", "jueves", "viernes"]
        },
        upper_lower: {
            4: [
                { day: "lunes", type: "upper" },
                { day: "martes", type: "lower" },
                { day: "jueves", type: "upper" },
                { day: "viernes", type: "lower" }
            ]
        },
        ppl: {
            5: [
                { day: "lunes", type: "push" },
                { day: "martes", type: "pull" },
                { day: "miercoles", type: "legs" },
                { day: "jueves", type: "push" },
                { day: "viernes", type: "pull" }
            ],
            6: [
                { day: "lunes", type: "push" },
                { day: "martes", type: "pull" },
                { day: "miercoles", type: "legs" },
                { day: "jueves", type: "push" },
                { day: "viernes", type: "pull" },
                { day: "sabado", type: "legs" }
            ]
        }
    };

    const mapping = splitMappings[trainingStyle]?.[frequency];

    if (!mapping) {
        // Default: usar días disponibles del usuario
        return availableDays.slice(0, frequency).map((d, i) => ({
            day: d.toLowerCase(),
            type: trainingStyle === "ppl" ? ["push", "pull", "legs"][i % 3] :
                trainingStyle === "upper_lower" ? (i % 2 === 0 ? "upper" : "lower") :
                    "full_body"
        }));
    }

    return mapping;
};

export default {
    ROUTINE_TEMPLATES,
    selectTemplate,
    getTrainingDays
};
