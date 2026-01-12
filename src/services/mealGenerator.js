/**
 * Generador de Recetas Individual - FitAI
 * 
 * Este servicio genera recetas INDIVIDUALES usando IA.
 * En lugar de pedir un plan de 7 días, pedimos UNA receta a la vez
 * con macros específicos, lo que garantiza precisión y consistencia.
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';

/**
 * Genera UNA receta específica que cumpla con los macros indicados
 * 
 * @param {Object} params - Parámetros de la receta
 * @param {string} params.mealType - Tipo de comida (desayuno, almuerzo, merienda, cena)
 * @param {number} params.calories - Calorías objetivo para esta comida
 * @param {Object} params.macros - { protein, carbs, fats } en gramos
 * @param {string} params.culture - Cultura gastronómica (Argentina, etc.)
 * @param {Array} params.avoid - Ingredientes a evitar
 * @param {string} params.dayName - Nombre del día para variedad
 * @returns {Object} Receta generada
 */
export const generateSingleMeal = async (params) => {
    const {
        mealType = 'almuerzo',
        calories = 500,
        macros = { protein: 40, carbs: 50, fats: 15 },
        culture = 'Argentina',
        avoid = [],
        dayName = 'Lunes'
    } = params;

    const varietySeed = Math.random().toString(36).substring(7);
    const systemPrompt = `Eres un chef nutricionista argentino premium especializado en nutrición deportiva y longevidad. 
Tu objetivo es crear recetas CREATIVAS, ÚNICAS y DELICIOSAS que cumplan con los macros solicitados.
REGLAS ESTRICTAS:
1. Lista TODOS los ingredientes con su peso EXACTO en gramos.
2. La suma de macros debe ser precisa (+/- 5%).
3. Estilo gastronómico: ${culture}.
4. ALTA PRIORIDAD: Usa huevos y claras como fuente principal de proteína en desayunos y cenas.
5. VARIEDAD: No repitas recetas genéricas. Busca combinaciones interesantes (ej: huevos con palta y frutos secos, tortillas de vegetales con queso light, etc.).
6. Formato: JSON puro. Semilla de variedad: ${varietySeed}`;

    const userPrompt = `Genera una receta ÚNICA de ${mealType} para el día ${dayName}.
IMPORTANTE: Que sea una opción ${culture} de alta calidad.
${mealType === 'desayuno' || mealType === 'cena' ? 'Prioriza incluir huevos/claras.' : ''}

OBJETIVOS:
- Calorías: ${calories} kcal
- Proteína: ${macros.protein}g
- Carbohidratos: ${macros.carbs}g
- Grasas: ${macros.fats}g

${avoid.length > 0 ? `EVITAR ESTRICTAMENTE: ${avoid.join(', ')}` : ''}

FORMATO JSON:
{
    "name": "Nombre creativo del plato",
    "description": "- Peso Ingrediente 1\\n- Peso Ingrediente 2",
    "ingredients": [{ "name": "Ingrediente", "quantity": 100, "unit": "g" }],
    "preparation": "Instrucciones paso a paso",
    "calories": ${calories},
    "macros": { "protein": ${macros.protein}, "carbs": ${macros.carbs}, "fats": ${macros.fats} },
    "prepTime": 15,
    "cookTime": 15
}

Responde SOLO con el JSON.`;

    try {
        const { generateWithOpenRouter } = await import('./openrouterService');

        // El proxy espera (type, userData) o podemos usar callAiProxy directamente
        // Para máxima flexibilidad en mealGenerator, usaremos la lógica de openrouterService
        const response = await generateWithOpenRouter('meal_recipe', {
            mealType,
            calories,
            macros,
            culture,
            avoid,
            dayName,
            varietySeed,
            customSystemPrompt: systemPrompt,
            customUserPrompt: userPrompt
        });

        return response;

    } catch (error) {
        console.error('[MealGenerator] Error:', error);
        // Retornar receta de fallback
        return createFallbackMeal(mealType, calories, macros);
    }
};

/**
 * Genera un plan semanal completo usando el sistema de plantillas + IA
 * 
 * @param {Object} metabolicProfile - Perfil metabólico del usuario
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Plan nutricional de 7 días
 */
export const generateWeeklyPlan = async (metabolicProfile, options = {}) => {
    const {
        culture = 'Argentina',
        avoid = [],
        onProgress = () => { }
    } = options;

    const { mealDistribution, dailyMacros, metabolism } = metabolicProfile;

    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const mealTypes = ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack', 'pre-sueno'];

    const weeklyPlan = {};
    let totalMealsGenerated = 0;
    const totalMeals = days.length * mealDistribution.length;

    for (const day of days) {
        weeklyPlan[day] = [];

        for (let i = 0; i < mealDistribution.length; i++) {
            const mealTemplate = mealDistribution[i];

            onProgress({
                day,
                mealIndex: i,
                progress: Math.round((totalMealsGenerated / totalMeals) * 100),
                message: `Generando ${mealTemplate.name} del ${day}...`
            });

            try {
                const meal = await generateSingleMeal({
                    mealType: mealTypes[i] || mealTemplate.name.toLowerCase(),
                    calories: mealTemplate.calories,
                    macros: mealTemplate.macros,
                    culture,
                    avoid,
                    dayName: day
                });

                weeklyPlan[day].push({
                    ...meal,
                    time: mealTemplate.time,
                    slot: i
                });

            } catch (error) {
                console.error(`Error generando ${mealTemplate.name} del ${day}:`, error);
                // Usar receta de fallback
                weeklyPlan[day].push(createFallbackMeal(
                    mealTemplate.name.toLowerCase(),
                    mealTemplate.calories,
                    mealTemplate.macros
                ));
            }

            totalMealsGenerated++;

            // Pequeña pausa para no saturar la API
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    return {
        title: `Plan Nutricional Argentino: ${metabolism.targetCalories} kcal`,
        description: `Plan personalizado de 7 días con ${dailyMacros.protein}g de proteína diaria.`,
        weeklyPlan,
        weeklyMacros: {
            calories: metabolism.targetCalories,
            protein: dailyMacros.protein,
            carbs: dailyMacros.carbs,
            fats: dailyMacros.fats
        },
        summary: {
            tmb: metabolism.tmb,
            tdee: metabolism.tdee,
            targetCalories: metabolism.targetCalories,
            deficit: metabolism.adjustment,
            explanation: metabolism.explanation
        },
        hydration: 'Mínimo 3.5 litros de agua diarios.',
        generatedAt: new Date().toISOString()
    };
};

/**
 * Genera un plan rápido usando plantillas predefinidas (sin IA)
 * 100% DETERMINÍSTICO - Siempre 4 comidas por día, siempre con detalles
 */
export const generateQuickPlan = (metabolicProfile, culture = 'Argentina') => {
    const { mealDistribution, dailyMacros, metabolism } = metabolicProfile;

    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    // Plantillas FIJAS de comidas argentinas con ingredientes detallados
    // Usamos \n real para saltos de línea
    const DESAYUNOS = [
        { name: "Huevos revueltos con tostada", description: "- 3 Huevos (150g)\n- 2 Rebanadas pan integral (60g)\n- 1 cda Aceite de oliva (10g)\n- Sal y pimienta a gusto" },
        { name: "Omelette de claras con vegetales", description: "- 4 Claras de huevo (120g)\n- 1 Huevo entero (50g)\n- 50g Espinaca fresca\n- 30g Queso descremado\n- 1 Rebanada pan integral (30g)" },
        { name: "Huevos pochados con palta", description: "- 2 Huevos grandes (100g)\n- 50g Palta/Aguacate\n- 1 Rebanada pan de masa madre (50g)\n- Semillas de sésamo" },
        { name: "Tostada francesa proteica", description: "- 2 Rebanadas pan integral (60g)\n- 2 Huevos (100g)\n- 50ml Leche descremada\n- 1 Banana (120g)\n- Canela a gusto" },
        { name: "Revuelto de claras y avena", description: "- 5 Claras de huevo (150g)\n- 40g Avena instantánea\n- 1 cdita Esencia de vainilla\n- Endulzante a gusto\n- 10g Nueces" },
        { name: "Sándwich matutino proteico", description: "- 2 Rebanadas pan integral\n- 1 Huevo a la plancha\n- 2 Fetas de jamón cocido magro\n- 1 Feta de queso tybo" },
        { name: "Panqueques de avena y clara", description: "- 4 Claras de huevo (120g)\n- 50g Avena\n- 1 Banana pisada\n- 1 cda Mousse de queso descremado" }
    ];

    const ALMUERZOS = [
        { name: "Bife de lomo con batata", description: "- 250g Bife de lomo magro a la plancha\n- 200g Batata al horno\n- 150g Ensalada mixta (lechuga, tomate, cebolla)\n- 15g Aceite de oliva" },
        { name: "Pollo grillado con arroz integral", description: "- 220g Pechuga de pollo a la plancha\n- 180g Arroz integral cocido\n- 150g Brócoli al vapor\n- 10g Aceite de oliva" },
        { name: "Milanesa de carne al horno con huevo", description: "- 200g Milanesa de carne al horno\n- 1 Huevo frito en agua o spray (50g)\n- 150g Puré de calabaza\n- 100g Ensalada de rúcula" },
        { name: "Arroz con pollo y huevo duro", description: "- 150g Pechuga de pollo\n- 120g Arroz blanco\n- 1 Huevo duro (50g)\n- Arvejas y zanahoria (100g)" },
        { name: "Peceto al horno con vegetales", description: "- 220g Peceto al horno\n- 200g Mix de vegetales asados (zapallo, zanahoria, cebolla)\n- 100g Arroz yamani\n- 10g Aceite de oliva" },
        { name: "Ensalada completa con atún y huevo", description: "- 1 Lata de atún al natural\n- 2 Huevos duros (100g)\n- 150g Papa hervida\n- Tomate, lechuga y chauchas" },
        { name: "Hamburguesa casera con ensalada", description: "- 200g Carne picada magra (hamburguesa casera)\n- 2 Rebanadas pan integral (60g)\n- 100g Lechuga y tomate\n- 30g Queso descremado" },
        { name: "Tortilla de papas individual (Light)", description: "- 2 Huevos enteros + 2 claras\n- 1 Papa mediana (150g) cocida al vapor\n- 1 Cebolla salteada con spray\n- Ensalada de tomate" },
        { name: "Zapallitos rellenos con carne y huevo", description: "- 2 Zapallitos redondos\n- 150g Carne magra picada\n- 1 Huevo duro picado\n- 30g Queso light" }
    ];

    const MERIENDAS = [
        { name: "Tostada con palta y huevo", description: "- 1 Rebanada pan integral (30g)\n- 50g Palta/Aguacate\n- 1 Huevo duro (50g)\n- Sal y limón a gusto" },
        { name: "Yogur griego con frutos secos", description: "- 200g Yogur griego natural\n- 30g Mix de frutos secos (almendras, nueces)\n- 100g Frutillas frescas" },
        { name: "Muffin proteico de huevo y verdura", description: "- 2 Huevos enteros\n- 50g Espinaca picada\n- 30g Queso rallado hebras\n- Sal y orégano" },
        { name: "Licuado proteico", description: "- 200ml Leche descremada\n- 1 Banana (120g)\n- 30g Proteína en polvo\n- 15g Mantequilla de maní" },
        { name: "Claras a la nieve con fruta", description: "- 3 Claras batidas a nieve\n- 1 Manzana verde picada\n- Canela y stevia\n- 10g Almendras" },
        { name: "Barrita proteica casera", description: "- 40g Avena\n- 20g Proteína en polvo\n- 15g Mantequilla de maní\n- 10g Miel" },
        { name: "Tostadas con huevo revuelto", description: "- 2 Tostadas de pan integral\n- 2 Huevos revueltos\n- Un toque de ciboulette" }
    ];

    const CENAS = [
        { name: "Salmón con vegetales asados", description: "- 200g Filet de salmón rosado\n- 200g Mix de vegetales asados (zapallito, berenjena, morrón)\n- 100g Quinoa cocida\n- 10g Aceite de oliva" },
        { name: "Omelette completo con ensalada", description: "- 3 Huevos (150g)\n- 50g Jamón cocido magro\n- 50g Queso mozzarella light\n- Ensalada de hojas verdes" },
        { name: "Wok de pollo, vegetales y huevo", description: "- 180g Pechuga de pollo\n- 1 Huevo (50g) integrado al wok\n- Brócoli, zanahoria y brotes de soja" },
        { name: "Bife de chorizo con puré", description: "- 200g Bife de chorizo magro\n- 180g Puré de calabaza\n- 100g Ensalada de rúcula" },
        { name: "Revuelto de zapallitos con huevo", description: "- 2 Zapallitos redondos\n- 2 Huevos enteros (100g)\n- 1 Cebolla blanca chica\n- 50g Queso por salut light" },
        { name: "Merluza al horno con huevo picado", description: "- 220g Filet de merluza\n- 1 Huevo duro picado arriba\n- 150g Papas al natural con perejil" },
        { name: "Cerdo con batata y espinaca", description: "- 200g Lomo de cerdo a la plancha\n- 180g Batata al horno\n- 100g Espinaca salteada con ajo" },
        { name: "Tortilla de espinacas y queso", description: "- 3 Huevos enteros\n- 200g Espinaca fresca\n- 50g Queso cottage o ricota\n- 1 Tostada integral" }
    ];

    const weeklyPlan = {};

    // Generar plan con aleatoriedad para evitar duplicidad al regenerar
    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const day = days[dayIndex];

        // Usar un índice base aleatorio por día para que "Regenerar" cambie el resultado
        const randomOffset = Math.floor(Math.random() * 10);

        weeklyPlan[day] = [
            {
                name: DESAYUNOS[(dayIndex + randomOffset) % DESAYUNOS.length].name,
                description: DESAYUNOS[(dayIndex + randomOffset) % DESAYUNOS.length].description,
                time: "08:00",
                calories: mealDistribution[0]?.calories || Math.round(metabolism.targetCalories * 0.25),
                macros: mealDistribution[0]?.macros || { protein: Math.round(dailyMacros.protein * 0.25), carbs: Math.round(dailyMacros.carbs * 0.25), fats: Math.round(dailyMacros.fats * 0.25) },
                slot: 0
            },
            {
                name: ALMUERZOS[(dayIndex + randomOffset) % ALMUERZOS.length].name,
                description: ALMUERZOS[(dayIndex + randomOffset) % ALMUERZOS.length].description,
                time: "13:00",
                calories: mealDistribution[1]?.calories || Math.round(metabolism.targetCalories * 0.35),
                macros: mealDistribution[1]?.macros || { protein: Math.round(dailyMacros.protein * 0.35), carbs: Math.round(dailyMacros.carbs * 0.35), fats: Math.round(dailyMacros.fats * 0.35) },
                slot: 1
            },
            {
                name: MERIENDAS[(dayIndex + randomOffset) % MERIENDAS.length].name,
                description: MERIENDAS[(dayIndex + randomOffset) % MERIENDAS.length].description,
                time: "17:00",
                calories: mealDistribution[2]?.calories || Math.round(metabolism.targetCalories * 0.15),
                macros: mealDistribution[2]?.macros || { protein: Math.round(dailyMacros.protein * 0.15), carbs: Math.round(dailyMacros.carbs * 0.15), fats: Math.round(dailyMacros.fats * 0.15) },
                slot: 2
            },
            {
                name: CENAS[(dayIndex + randomOffset) % CENAS.length].name,
                description: CENAS[(dayIndex + randomOffset) % CENAS.length].description,
                time: "20:30",
                calories: mealDistribution[3]?.calories || Math.round(metabolism.targetCalories * 0.25),
                macros: mealDistribution[3]?.macros || { protein: Math.round(dailyMacros.protein * 0.25), carbs: Math.round(dailyMacros.carbs * 0.25), fats: Math.round(dailyMacros.fats * 0.25) },
                slot: 3
            }
        ];
    }

    return {
        title: `Plan Nutricional Argentino: ${metabolism.targetCalories} kcal`,
        description: `Plan de 7 días con ${dailyMacros.protein}g de proteína diaria. Foco en carnes magras argentinas.`,
        weeklyPlan,
        weeklyMacros: {
            calories: metabolism.targetCalories,
            protein: dailyMacros.protein,
            carbs: dailyMacros.carbs,
            fats: dailyMacros.fats
        },
        summary: {
            tmb: metabolism.tmb,
            tdee: metabolism.tdee,
            targetCalories: metabolism.targetCalories,
            deficit: metabolism.adjustment,
            explanation: metabolism.explanation
        },
        hydration: 'Mínimo 3.5 litros de agua diarios.',
        generatedAt: new Date().toISOString()
    };
};

/**
 * Crea una comida de fallback cuando la IA falla
 */
const createFallbackMeal = (mealType, calories, macros) => {
    const fallbacks = {
        desayuno: {
            name: "Desayuno Proteico Clásico",
            description: "- 3 Huevos revueltos (150g)\\n- 2 Rebanadas pan integral (60g)\\n- 1 cda Aceite de oliva (10g)"
        },
        almuerzo: {
            name: "Almuerzo Argentino Clásico",
            description: "- 200g Bife de lomo a la plancha\\n- 150g Arroz integral\\n- 100g Ensalada mixta\\n- 10g Aceite de oliva"
        },
        merienda: {
            name: "Merienda Proteica",
            description: "- 200g Yogur griego\\n- 30g Frutos secos\\n- 100g Frutas frescas"
        },
        cena: {
            name: "Cena Balanceada",
            description: "- 200g Pollo a la plancha\\n- 150g Vegetales asados\\n- 100g Batata\\n- 10g Aceite de oliva"
        }
    };

    const fallback = fallbacks[mealType] || fallbacks.almuerzo;

    return {
        ...fallback,
        calories,
        macros,
        time: mealType === 'desayuno' ? '08:00' :
            mealType === 'almuerzo' ? '13:00' :
                mealType === 'merienda' ? '17:00' : '20:30'
    };
};

export default {
    generateSingleMeal,
    generateWeeklyPlan,
    generateQuickPlan
};
