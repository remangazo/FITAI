import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, User, Target, Scale, Dumbbell, Heart, Clock,
    UtensilsCrossed, Sparkles, Check, AlertTriangle, Moon, Brain, Calendar,
    Building, Bike, BedDouble, Flame, Ruler, Percent, Utensils, LogOut,
    Trophy, Globe, Award, Crosshair, MapPin, GraduationCap, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';
import { trainerService } from '../services/trainerService';



export default function Onboarding() {
    const navigate = useNavigate();
    const { user, updateProfile } = useAuth();
    const stepConfig = [
        { icon: User, title: 'IDENTIDAD', color: 'blue' },
        { icon: Target, title: 'OBJETIVOS', color: 'purple' },
        { icon: Scale, title: 'BIOMETRÍA', color: 'cyan' },
        { icon: Dumbbell, title: 'EXPERIENCIA', color: 'orange' },
        { icon: Trophy, title: 'FUERZA', color: 'amber', conditional: true },      // NUEVO - Solo si hasExperience
        { icon: Award, title: 'TÉCNICA', color: 'lime', conditional: true },        // NUEVO - Solo si hasExperience
        { icon: Building, title: 'EQUIPAMIENTO', color: 'green' },
        { icon: Calendar, title: 'HORARIOS', color: 'pink' },
        { icon: Heart, title: 'SALUD', color: 'red' },
        { icon: UtensilsCrossed, title: 'NUTRICIÓN', color: 'yellow' },
        { icon: Brain, title: 'MOTIVACIÓN', color: 'indigo' },
        { icon: GraduationCap, title: 'ENTRENADOR', color: 'cyan' }, // Step 11: Coach Code
        { icon: Sparkles, title: 'LISTO', color: 'gradient' },      // Step 12: Confirmation
    ];

    const TOTAL_STEPS = stepConfig.length;

    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        // Step 1: Identity
        name: user?.displayName || '',
        gender: '',
        birthYear: '',
        country: '', // NUEVO: País de residencia

        // Step 2: Goals
        primaryGoal: '',
        secondaryGoals: [],

        // Step 3: Biometrics
        weight: '',
        height: '',
        bodyFat: '',
        targetWeight: '',
        units: 'metric',

        // Step 4: Training Experience
        experienceYears: '',
        trainingFrequency: '',
        preferredStyle: '',

        // Step 5: Strength Benchmarks (NUEVO - solo si experienceYears > 0)
        benchmarkShoulderPress: '', // Press militar sentado con mancuernas (kg)
        benchmarkBenchPress: '',    // Press banca con barra (kg)
        benchmarkDeadlift: '',      // Peso muerto (kg)
        benchmarkPullups: '',       // Dominadas (reps)
        benchmarkSquat: '',         // Sentadilla (kg)

        // Step 6: Technique Assessment (NUEVO - solo si experienceYears > 0)
        techniqueLevel: '',         // principiante, intermedio, avanzado
        hasCoachExperience: '',     // Sí/No - ha trabajado con entrenador
        knownWeaknesses: [],        // Áreas débiles conocidas

        // Step 7: Equipment
        trainingLocation: '',
        availableEquipment: [],

        // Step 8: Schedule & Lifestyle
        occupation: '',
        availableDays: [],
        preferredTime: '',
        sessionDuration: '',

        // Step 9: Health
        injuries: '',
        medicalConditions: [],
        sleepHours: '',
        stressLevel: '',

        // Step 10: Nutrition
        dietType: '',
        allergies: [],
        mealsPerDay: '',
        waterIntake: '',
        supplements: [],

        // Step 11: Motivation & Psychology
        motivationLevel: '',
        previousAttempts: '',
        biggestChallenge: '',

        // Step 12: Coach Code (optional)
        coachCode: '',

        // Step 13: Confirmation
    });

    const [validatedCoach, setValidatedCoach] = useState(null);
    const [isValidatingCode, setIsValidatingCode] = useState(false);

    useEffect(() => {
        if (!user) {
            const timer = setTimeout(() => {
                navigate('/login?redirect=onboarding');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [user, navigate]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const toggleArrayField = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(v => v !== value)
                : [...prev[field], value]
        }));
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const handleSubmit = async () => {
        if (!user) {
            setError('Debes iniciar sesión para guardar tu progreso.');
            navigate('/login');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            let coachId = null;
            if (validatedCoach) {
                const linkResult = await trainerService.linkStudentToCoach(user.uid, formData.coachCode);
                coachId = linkResult.trainerId;
            }

            await updateProfile({
                ...formData,
                coachId,
                onboardingCompleted: true,
                onboardingDate: new Date().toISOString()
            });
            navigate('/dashboard');
        } catch (error) {
            console.error('Error saving profile:', error);
            setError('Error al guardar el perfil: ' + error.message);
        }
        setIsSubmitting(false);
    };

    const validateCoachCode = async (code) => {
        if (!code || code.length < 10) {
            setValidatedCoach(null);
            return;
        }

        setIsValidatingCode(true);
        try {
            const trainer = await trainerService.getTrainerByCode(code.toUpperCase());
            setValidatedCoach(trainer);
        } catch (error) {
            console.error('Error validating coach code:', error);
            setValidatedCoach(null);
        }
        setIsValidatingCode(false);
    };

    const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;
    const hasExperience = formData.experienceYears && formData.experienceYears !== '0' && formData.experienceYears !== 'none';

    const currentConfig = stepConfig[currentStep];

    // Safety Checks para prevenir Pantalla Negra
    if (!user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <p>Verificando sesión...</p>
            </div>
        );
    }

    if (!currentConfig) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white flex-col gap-4">
                <AlertTriangle className="text-red-500" size={48} />
                <h2 className="text-xl font-bold">Error de Configuración</h2>
                <p>No se pudo cargar el paso {currentStep}</p>
                <button
                    onClick={() => setCurrentStep(0)}
                    className="bg-blue-600 px-4 py-2 rounded-lg"
                >
                    Reiniciar Onboarding
                </button>
            </div>
        );
    }

    try {
        const StepIcon = currentConfig.icon;

        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col">
                {/* Header */}
                <header className="px-4 py-4 border-b border-white/5 sticky top-0 bg-slate-950/90 backdrop-blur-xl z-50">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex items-center justify-between mb-3">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className="p-2 rounded-xl bg-slate-900 border border-white/5 disabled:opacity-30"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="text-center">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    Paso {currentStep + 1} de {TOTAL_STEPS}
                                </div>
                                <div className="text-xs font-black text-slate-300 uppercase tracking-wide">
                                    {currentConfig.title}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    // Logout forzado
                                    auth.signOut();
                                    localStorage.clear();
                                    window.location.href = '/login';
                                }}
                                className="p-2 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                                title="Cerrar Sesión / Reiniciar"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 px-4 py-8 overflow-y-auto">
                    <div className="max-w-2xl mx-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Step 0: Identity */}
                                {currentStep === 0 && (
                                    <StepContainer icon={User} title="¿Cómo te llamas?" subtitle="Cuéntanos sobre ti para personalizar tu experiencia">
                                        <InputField
                                            label="Tu nombre"
                                            value={formData.name}
                                            onChange={(v) => updateField('name', v)}
                                            placeholder="Ej: Carlos"
                                        />
                                        <div className="mt-6">
                                            <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">Género</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['Hombre', 'Mujer', 'Otro'].map(g => (
                                                    <SelectCard
                                                        key={g}
                                                        selected={formData.gender === g}
                                                        onClick={() => updateField('gender', g)}
                                                        label={g}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <InputField
                                            label="Año de nacimiento"
                                            value={formData.birthYear}
                                            onChange={(v) => updateField('birthYear', v)}
                                            placeholder="Ej: 1995"
                                            type="number"
                                            className="mt-6"
                                        />

                                        {/* NUEVO: Selector de País */}
                                        <div className="mt-6">
                                            <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">
                                                <MapPin className="inline mr-2" size={14} />
                                                País de residencia
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { code: 'AR', name: 'Argentina 🇦🇷' },
                                                    { code: 'MX', name: 'México 🇲🇽' },
                                                    { code: 'CO', name: 'Colombia 🇨🇴' },
                                                    { code: 'CL', name: 'Chile 🇨🇱' },
                                                    { code: 'PE', name: 'Perú 🇵🇪' },
                                                    { code: 'ES', name: 'España 🇪🇸' },
                                                    { code: 'UY', name: 'Uruguay 🇺🇾' },
                                                    { code: 'VE', name: 'Venezuela 🇻🇪' },
                                                    { code: 'EC', name: 'Ecuador 🇪🇨' },
                                                    { code: 'US', name: 'USA 🇺🇸' },
                                                ].map(country => (
                                                    <SelectCard
                                                        key={country.code}
                                                        selected={formData.country === country.code}
                                                        onClick={() => updateField('country', country.code)}
                                                        label={country.name}
                                                        compact
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </StepContainer>
                                )}

                                {/* Step 1: Goals */}
                                {currentStep === 1 && (
                                    <StepContainer icon={Target} title="¿Cuál es tu objetivo principal?" subtitle="Esto definirá tu plan de entrenamiento y nutrición">
                                        <div className="space-y-3">
                                            {[
                                                { id: 'muscle', icon: '💪', label: 'Ganar Músculo', desc: 'Hipertrofia y fuerza' },
                                                { id: 'fat', icon: '🔥', label: 'Perder Grasa', desc: 'Definición y cutting' },
                                                { id: 'strength', icon: '🏋️', label: 'Aumentar Fuerza', desc: 'Powerlifting y rendimiento' },
                                                { id: 'health', icon: '❤️', label: 'Mejorar Salud', desc: 'Bienestar general' },
                                                { id: 'athletic', icon: '⚡', label: 'Rendimiento Atlético', desc: 'Velocidad, potencia, agilidad' },
                                                { id: 'endurance', icon: '🏃', label: 'Resistencia', desc: 'Cardio y aguante' },
                                            ].map(goal => (
                                                <GoalCard
                                                    key={goal.id}
                                                    selected={Array.isArray(formData.primaryGoal) ? formData.primaryGoal.includes(goal.id) : formData.primaryGoal === goal.id}
                                                    onClick={() => {
                                                        const currentGoals = Array.isArray(formData.primaryGoal) ? formData.primaryGoal :
                                                            (formData.primaryGoal ? [formData.primaryGoal] : []);
                                                        const newGoals = currentGoals.includes(goal.id)
                                                            ? currentGoals.filter(g => g !== goal.id)
                                                            : [...currentGoals, goal.id];
                                                        updateField('primaryGoal', newGoals);
                                                    }}
                                                    icon={goal.icon}
                                                    label={goal.label}
                                                    desc={goal.desc}
                                                />
                                            ))}
                                        </div>
                                    </StepContainer>
                                )}

                                {/* Step 2: Biometrics */}
                                {currentStep === 2 && (
                                    <StepContainer icon={Scale} title="Datos Biométricos" subtitle="Estos datos nos ayudan a calcular tus necesidades exactas">
                                        <div className="flex gap-2 mb-6">
                                            {['metric', 'imperial'].map(u => (
                                                <button
                                                    key={u}
                                                    onClick={() => updateField('units', u)}
                                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${formData.units === u ? 'bg-blue-600' : 'bg-slate-900 text-slate-500'
                                                        }`}
                                                >
                                                    {u === 'metric' ? 'Kg / Cm' : 'Lb / Ft'}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <NumberInput
                                                icon={<Scale size={18} />}
                                                label={`Peso Actual (${formData.units === 'metric' ? 'kg' : 'lb'})`}
                                                value={formData.weight}
                                                onChange={(v) => updateField('weight', v)}
                                            />
                                            <NumberInput
                                                icon={<Ruler size={18} />}
                                                label={`Altura (${formData.units === 'metric' ? 'cm' : 'ft'})`}
                                                value={formData.height}
                                                onChange={(v) => updateField('height', v)}
                                            />
                                            <NumberInput
                                                icon={<Percent size={18} />}
                                                label="% Grasa Corporal"
                                                value={formData.bodyFat}
                                                onChange={(v) => updateField('bodyFat', v)}
                                                optional
                                            />
                                            <NumberInput
                                                icon={<Target size={18} />}
                                                label={`Peso Objetivo (${formData.units === 'metric' ? 'kg' : 'lb'})`}
                                                value={formData.targetWeight}
                                                onChange={(v) => updateField('targetWeight', v)}
                                            />
                                        </div>
                                    </StepContainer>
                                )}

                                {/* Step 3: Experience */}
                                {currentStep === 3 && (
                                    <StepContainer icon={Dumbbell} title="Experiencia de Entrenamiento" subtitle="¿Cuánto tiempo llevas entrenando?">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">Años de experiencia</label>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {['Principiante', '1-2 años', '3-5 años', '+5 años'].map(exp => (
                                                        <SelectCard
                                                            key={exp}
                                                            selected={formData.experienceYears === exp}
                                                            onClick={() => updateField('experienceYears', exp)}
                                                            label={exp}
                                                            compact
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">Frecuencia semanal actual</label>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {['0-1 días', '2-3 días', '4-5 días', '6+ días'].map(freq => (
                                                        <SelectCard
                                                            key={freq}
                                                            selected={formData.trainingFrequency === freq}
                                                            onClick={() => updateField('trainingFrequency', freq)}
                                                            label={freq}
                                                            compact
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">Estilo preferido</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {['Bodybuilding', 'Powerlifting', 'CrossFit', 'Funcional', 'Calistenia', 'Híbrido'].map(style => (
                                                        <SelectCard
                                                            key={style}
                                                            selected={formData.preferredStyle === style}
                                                            onClick={() => updateField('preferredStyle', style)}
                                                            label={style}
                                                            compact
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </StepContainer>
                                )}

                                {/* Step 4: Strength Benchmarks (NUEVO - Solo si tiene experiencia) */}
                                {currentStep === 4 && (
                                    <StepContainer icon={Trophy} title="Tests de Fuerza" subtitle="¿Cuánto peso levantás en estos ejercicios? (1 serie máxima o aproximada)">
                                        {hasExperience ? (
                                            <div className="space-y-4">
                                                <p className="text-sm text-slate-400 bg-slate-900 p-3 rounded-xl border border-white/5">
                                                    💪 Estos datos nos ayudan a calcular tu masa muscular real y personalizar mejor tus macros y rutinas.
                                                </p>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                                        <label className="text-xs text-amber-400 font-bold uppercase block mb-2">🏋️ Press Militar Sentado (Mancuernas)</label>
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="number"
                                                                value={formData.benchmarkShoulderPress}
                                                                onChange={(e) => updateField('benchmarkShoulderPress', e.target.value)}
                                                                placeholder="Peso (kg)"
                                                                className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-center"
                                                            />
                                                            <span className="text-slate-500 text-sm">kg x mancuerna</span>
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                                        <label className="text-xs text-amber-400 font-bold uppercase block mb-2">🛋️ Press Banca (Barra)</label>
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="number"
                                                                value={formData.benchmarkBenchPress}
                                                                onChange={(e) => updateField('benchmarkBenchPress', e.target.value)}
                                                                placeholder="Peso (kg)"
                                                                className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-center"
                                                            />
                                                            <span className="text-slate-500 text-sm">kg total</span>
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                                        <label className="text-xs text-amber-400 font-bold uppercase block mb-2">🦵 Sentadilla (Barra)</label>
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="number"
                                                                value={formData.benchmarkSquat}
                                                                onChange={(e) => updateField('benchmarkSquat', e.target.value)}
                                                                placeholder="Peso (kg)"
                                                                className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-center"
                                                            />
                                                            <span className="text-slate-500 text-sm">kg total</span>
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                                        <label className="text-xs text-amber-400 font-bold uppercase block mb-2">💀 Peso Muerto</label>
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="number"
                                                                value={formData.benchmarkDeadlift}
                                                                onChange={(e) => updateField('benchmarkDeadlift', e.target.value)}
                                                                placeholder="Peso (kg)"
                                                                className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-center"
                                                            />
                                                            <span className="text-slate-500 text-sm">kg total</span>
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 col-span-full">
                                                        <label className="text-xs text-amber-400 font-bold uppercase block mb-2">🔼 Dominadas (Peso Corporal)</label>
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="number"
                                                                value={formData.benchmarkPullups}
                                                                onChange={(e) => updateField('benchmarkPullups', e.target.value)}
                                                                placeholder="Repeticiones"
                                                                className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-center"
                                                            />
                                                            <span className="text-slate-500 text-sm">reps máximas seguidas</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="text-6xl mb-4">🌱</div>
                                                <h3 className="text-xl font-bold mb-2">¡Perfecto para empezar!</h3>
                                                <p className="text-slate-400">Como sos principiante, te guiaremos paso a paso. No necesitás tests de fuerza todavía.</p>
                                                <p className="text-green-400 mt-4 text-sm">Podés avanzar al siguiente paso →</p>
                                            </div>
                                        )}
                                    </StepContainer>
                                )}

                                {/* Step 5: Technique Assessment (NUEVO) */}
                                {currentStep === 5 && (
                                    <StepContainer icon={Award} title="Evaluación de Técnica" subtitle="¿Cómo calificarías tu técnica y conocimiento?">
                                        {hasExperience ? (
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">Nivel de técnica en ejercicios compuestos</label>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {[
                                                            { id: 'principiante', label: 'Básica', desc: 'Aún aprendiendo' },
                                                            { id: 'intermedio', label: 'Buena', desc: 'Sólida en la mayoría' },
                                                            { id: 'avanzado', label: 'Avanzada', desc: 'Técnica depurada' },
                                                        ].map(tech => (
                                                            <SelectCard
                                                                key={tech.id}
                                                                selected={formData.techniqueLevel === tech.id}
                                                                onClick={() => updateField('techniqueLevel', tech.id)}
                                                                label={tech.label}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">¿Has trabajado con entrenador personal?</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <SelectCard
                                                            selected={formData.hasCoachExperience === 'yes'}
                                                            onClick={() => updateField('hasCoachExperience', 'yes')}
                                                            label="Sí, he tenido coach"
                                                        />
                                                        <SelectCard
                                                            selected={formData.hasCoachExperience === 'no'}
                                                            onClick={() => updateField('hasCoachExperience', 'no')}
                                                            label="No, autodidacta"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">Áreas débiles conocidas (selección múltiple)</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {['Espalda', 'Hombros', 'Pecho', 'Piernas', 'Brazos', 'Core/Abdominales', 'Cardio', 'Flexibilidad'].map(area => (
                                                            <MultiSelectCard
                                                                key={area}
                                                                selected={formData.knownWeaknesses.includes(area)}
                                                                onClick={() => toggleArrayField('knownWeaknesses', area)}
                                                                label={area}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="text-6xl mb-4">📚</div>
                                                <h3 className="text-xl font-bold mb-2">Aprenderás técnica desde cero</h3>
                                                <p className="text-slate-400">Te daremos rutinas con ejercicios básicos y progresiones seguras.</p>
                                                <p className="text-green-400 mt-4 text-sm">Podés avanzar al siguiente paso →</p>
                                            </div>
                                        )}
                                    </StepContainer>
                                )}

                                {/* Step 6: Equipment */}
                                {currentStep === 6 && (
                                    <StepContainer icon={Building} title="Equipamiento Disponible" subtitle="¿Dónde y con qué entrenas?">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">Lugar de entrenamiento</label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[
                                                        { id: 'gym', icon: '🏋️', label: 'Gimnasio' },
                                                        { id: 'home', icon: '🏠', label: 'Casa' },
                                                        { id: 'outdoor', icon: '🌳', label: 'Exterior' },
                                                    ].map(loc => (
                                                        <SelectCard
                                                            key={loc.id}
                                                            selected={formData.trainingLocation === loc.id}
                                                            onClick={() => updateField('trainingLocation', loc.id)}
                                                            label={loc.label}
                                                            icon={loc.icon}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">Equipamiento disponible (múltiple)</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {['Barras', 'Mancuernas', 'Máquinas', 'Cables/Poleas', 'Kettlebells', 'Bandas Elásticas', 'TRX', 'Ninguno/Solo Peso Corporal'].map(eq => (
                                                        <MultiSelectCard
                                                            key={eq}
                                                            selected={formData.availableEquipment.includes(eq)}
                                                            onClick={() => toggleArrayField('availableEquipment', eq)}
                                                            label={eq}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </StepContainer>
                                )}

                                {/* Step 7: Schedule */}
                                {currentStep === 7 && (
                                    <StepContainer icon={Calendar} title="Horarios y Disponibilidad" subtitle="¿Cuándo puedes entrenar?">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">Tipo de ocupación</label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[
                                                        { id: 'desk', icon: '💻', label: 'Escritorio' },
                                                        { id: 'active', icon: '🚶', label: 'Activo' },
                                                        { id: 'physical', icon: '🔨', label: 'Físico' },
                                                    ].map(occ => (
                                                        <SelectCard
                                                            key={occ.id}
                                                            selected={formData.occupation === occ.id}
                                                            onClick={() => updateField('occupation', occ.id)}
                                                            label={occ.label}
                                                            icon={occ.icon}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">Días disponibles</label>
                                                <div className="flex gap-2 flex-wrap">
                                                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                                                        <button
                                                            key={day}
                                                            onClick={() => toggleArrayField('availableDays', day)}
                                                            className={`w-12 h-12 rounded-xl font-bold text-sm transition-all ${formData.availableDays.includes(day)
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-slate-900 text-slate-600 border border-white/5'
                                                                }`}
                                                        >
                                                            {day}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">Horario preferido</label>
                                                    <div className="space-y-2">
                                                        {['Mañana', 'Mediodía', 'Tarde', 'Noche'].map(time => (
                                                            <SelectCard
                                                                key={time}
                                                                selected={formData.preferredTime === time}
                                                                onClick={() => updateField('preferredTime', time)}
                                                                label={time}
                                                                compact
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">Duración sesión</label>
                                                    <div className="space-y-2">
                                                        {['30-45 min', '45-60 min', '60-90 min', '+90 min'].map(dur => (
                                                            <SelectCard
                                                                key={dur}
                                                                selected={formData.sessionDuration === dur}
                                                                onClick={() => updateField('sessionDuration', dur)}
                                                                label={dur}
                                                                compact
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </StepContainer>
                                )}

                                {/* Step 8: Health */}
                                {currentStep === 8 && (
                                    <StepContainer icon={Heart} title="Salud y Condiciones" subtitle="Información importante para tu seguridad">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">¿Tienes lesiones activas?</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { id: 'none', icon: '✅', label: 'No, ninguna' },
                                                        { id: 'shoulder', icon: '🦴', label: 'Hombro' },
                                                        { id: 'back', icon: '🔙', label: 'Espalda' },
                                                        { id: 'knee', icon: '🦵', label: 'Rodilla' },
                                                        { id: 'wrist', icon: '✋', label: 'Muñeca' },
                                                        { id: 'other', icon: '⚠️', label: 'Otra' },
                                                    ].map(inj => (
                                                        <SelectCard
                                                            key={inj.id}
                                                            selected={formData.injuries === inj.id}
                                                            onClick={() => updateField('injuries', inj.id)}
                                                            label={inj.label}
                                                            icon={inj.icon}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3 flex items-center gap-2">
                                                        <Moon size={14} /> Horas de sueño
                                                    </label>
                                                    <div className="space-y-2">
                                                        {['<5h', '5-6h', '7-8h', '+8h'].map(hrs => (
                                                            <SelectCard
                                                                key={hrs}
                                                                selected={formData.sleepHours === hrs}
                                                                onClick={() => updateField('sleepHours', hrs)}
                                                                label={hrs}
                                                                compact
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3 flex items-center gap-2">
                                                        <Brain size={14} /> Nivel de estrés
                                                    </label>
                                                    <div className="space-y-2">
                                                        {['Bajo', 'Moderado', 'Alto', 'Muy Alto'].map(str => (
                                                            <SelectCard
                                                                key={str}
                                                                selected={formData.stressLevel === str}
                                                                onClick={() => updateField('stressLevel', str)}
                                                                label={str}
                                                                compact
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </StepContainer>
                                )}

                                {/* Step 9: Nutrition */}
                                {currentStep === 9 && (
                                    <StepContainer icon={UtensilsCrossed} title="Nutrición y Dieta" subtitle="Define tus preferencias alimentarias">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">Tipo de dieta</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {['Tradicional', 'Vegetariana', 'Vegana', 'Keto', 'Paleo', 'Mediterránea'].map(diet => (
                                                        <SelectCard
                                                            key={diet}
                                                            selected={formData.dietType === diet}
                                                            onClick={() => updateField('dietType', diet)}
                                                            label={diet}
                                                            compact
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">Alergias o intolerancias</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {['Ninguna', 'Gluten', 'Lácteos', 'Frutos Secos', 'Huevo', 'Mariscos'].map(allergy => (
                                                        <MultiSelectCard
                                                            key={allergy}
                                                            selected={formData.allergies.includes(allergy)}
                                                            onClick={() => toggleArrayField('allergies', allergy)}
                                                            label={allergy}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3 flex items-center gap-2">
                                                        <Utensils size={14} /> Comidas por día
                                                    </label>
                                                    <div className="space-y-2">
                                                        {['2-3', '4-5', '5-6', '+6'].map(meals => (
                                                            <SelectCard
                                                                key={meals}
                                                                selected={formData.mealsPerDay === meals}
                                                                onClick={() => updateField('mealsPerDay', meals)}
                                                                label={meals}
                                                                compact
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3 flex items-center gap-2">
                                                        💧 Agua diaria
                                                    </label>
                                                    <div className="space-y-2">
                                                        {['<1L', '1-2L', '2-3L', '+3L'].map(water => (
                                                            <SelectCard
                                                                key={water}
                                                                selected={formData.waterIntake === water}
                                                                onClick={() => updateField('waterIntake', water)}
                                                                label={water}
                                                                compact
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </StepContainer>
                                )}

                                {/* Step 10: Motivation */}
                                {currentStep === 10 && (
                                    <StepContainer icon={Brain} title="Motivación y Mentalidad" subtitle="Entendamos tu psicología para ayudarte mejor">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">¿Cómo está tu motivación ahora?</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { id: 'max', icon: '🔥', label: 'Al máximo' },
                                                        { id: 'high', icon: '💪', label: 'Alta' },
                                                        { id: 'medium', icon: '🤔', label: 'Regular' },
                                                        { id: 'low', icon: '😔', label: 'Necesito ayuda' },
                                                    ].map(mot => (
                                                        <SelectCard
                                                            key={mot.id}
                                                            selected={formData.motivationLevel === mot.id}
                                                            onClick={() => updateField('motivationLevel', mot.id)}
                                                            label={mot.label}
                                                            icon={mot.icon}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">¿Has intentado transformarte antes?</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { id: 'first', label: 'Primera vez' },
                                                        { id: 'few', label: 'Algunas veces' },
                                                        { id: 'many', label: 'Muchas veces' },
                                                        { id: 'always', label: 'Siempre lo intento' },
                                                    ].map(att => (
                                                        <SelectCard
                                                            key={att.id}
                                                            selected={formData.previousAttempts === att.id}
                                                            onClick={() => updateField('previousAttempts', att.id)}
                                                            label={att.label}
                                                            compact
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">¿Tu mayor desafío?</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {['Consistencia', 'Tiempo', 'Nutrición', 'Conocimiento', 'Lesiones', 'Motivación'].map(ch => (
                                                        <SelectCard
                                                            key={ch}
                                                            selected={formData.biggestChallenge === ch}
                                                            onClick={() => updateField('biggestChallenge', ch)}
                                                            label={ch}
                                                            compact
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </StepContainer>
                                )}

                                {/* Step 11: Coach Code (Optional) */}
                                {currentStep === 11 && (
                                    <StepContainer icon={GraduationCap} title="¿Tenés un Entrenador?" subtitle="Si tu profe te dio un código, ingresalo acá">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-xs text-slate-500 font-bold uppercase ml-1 block mb-3">Código de Coach (opcional)</label>
                                                <input
                                                    type="text"
                                                    value={formData.coachCode}
                                                    onChange={(e) => {
                                                        const value = e.target.value.toUpperCase();
                                                        updateField('coachCode', value);
                                                        validateCoachCode(value);
                                                    }}
                                                    placeholder="Ej: FITAI-JUAN-A1B2"
                                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg tracking-wider"
                                                />
                                            </div>

                                            {isValidatingCode && (
                                                <div className="flex items-center justify-center gap-2 text-slate-400">
                                                    <Loader2 className="animate-spin" size={18} />
                                                    <span>Verificando código...</span>
                                                </div>
                                            )}

                                            {validatedCoach && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-4"
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-lg font-black">
                                                        {validatedCoach.displayName?.[0]?.toUpperCase() || 'T'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-green-400">¡Código válido!</div>
                                                        <div className="text-sm text-white">{validatedCoach.displayName}</div>
                                                        {validatedCoach.specialties?.length > 0 && (
                                                            <div className="text-xs text-slate-400">
                                                                {validatedCoach.specialties.slice(0, 2).join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Check className="ml-auto text-green-400" size={24} />
                                                </motion.div>
                                            )}

                                            {formData.coachCode.length >= 10 && !isValidatingCode && !validatedCoach && (
                                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center text-sm text-red-400">
                                                    Código no encontrado. Verificá que esté bien escrito.
                                                </div>
                                            )}

                                            <div className="bg-slate-900/50 rounded-xl p-4 text-sm text-slate-400">
                                                <p className="font-bold text-white mb-2">¿No tenés código?</p>
                                                <p>No te preocupes, podés usar FITAI de forma independiente. Podés vincularte con un entrenador más adelante desde Configuración.</p>
                                            </div>
                                        </div>
                                    </StepContainer>
                                )}

                                {/* Step 12: Confirmation */}
                                {currentStep === 12 && (
                                    <StepContainer icon={Sparkles} title="¡Todo Listo!" subtitle="Resumen de tu perfil fitness profesional">
                                        <div className="space-y-4 mb-6">
                                            {/* Datos Personales */}
                                            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-4">
                                                <h4 className="text-xs text-blue-400 font-bold uppercase mb-3">📋 Datos Personales</h4>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <SummaryItem label="Nombre" value={formData.name} />
                                                    <SummaryItem label="País" value={formData.country || '-'} />
                                                    <SummaryItem label="Nacimiento" value={formData.birthYear} />
                                                    <SummaryItem label="Género" value={formData.gender} />
                                                </div>
                                            </div>

                                            {/* Objetivos y Biometría */}
                                            <div className="bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-white/10 rounded-2xl p-4">
                                                <h4 className="text-xs text-green-400 font-bold uppercase mb-3">🎯 Objetivos & Biometría</h4>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <SummaryItem label="Objetivo" value={formData.primaryGoal} />
                                                    <SummaryItem label="Peso Actual" value={`${formData.weight} ${formData.units === 'metric' ? 'kg' : 'lb'}`} />
                                                    <SummaryItem label="Altura" value={`${formData.height} cm`} />
                                                    <SummaryItem label="Peso Objetivo" value={`${formData.targetWeight} ${formData.units === 'metric' ? 'kg' : 'lb'}`} />
                                                </div>
                                            </div>

                                            {/* Experiencia y Fuerza */}
                                            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-white/10 rounded-2xl p-4">
                                                <h4 className="text-xs text-amber-400 font-bold uppercase mb-3">💪 Experiencia & Fuerza</h4>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <SummaryItem label="Experiencia" value={formData.experienceYears} />
                                                    <SummaryItem label="Estilo" value={formData.preferredStyle} />
                                                    {formData.benchmarkBenchPress && (
                                                        <SummaryItem label="Press Banca" value={`${formData.benchmarkBenchPress} kg`} />
                                                    )}
                                                    {formData.benchmarkSquat && (
                                                        <SummaryItem label="Sentadilla" value={`${formData.benchmarkSquat} kg`} />
                                                    )}
                                                    {formData.benchmarkDeadlift && (
                                                        <SummaryItem label="Peso Muerto" value={`${formData.benchmarkDeadlift} kg`} />
                                                    )}
                                                    {formData.benchmarkPullups && (
                                                        <SummaryItem label="Dominadas" value={`${formData.benchmarkPullups} reps`} />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Disponibilidad */}
                                            <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-4">
                                                <h4 className="text-xs text-pink-400 font-bold uppercase mb-3">📅 Disponibilidad</h4>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <SummaryItem label="Días" value={formData.availableDays.join(', ') || '-'} />
                                                    <SummaryItem label="Duración" value={formData.sessionDuration} />
                                                    <SummaryItem label="Horario" value={formData.preferredTime} />
                                                    <SummaryItem label="Lugar" value={formData.trainingLocation} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-center p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-2xl">
                                            <div className="text-2xl mb-2">🚀</div>
                                            <p className="text-green-300 font-bold">Todo configurado profesionalmente</p>
                                            <p className="text-slate-400 text-sm">FITAI usará TODOS estos datos para crear planes ultra-personalizados.</p>
                                        </div>
                                    </StepContainer>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>

                {/* Footer Navigation */}
                <footer className="px-4 py-4 border-t border-white/5 bg-slate-950/90 backdrop-blur-xl sticky bottom-0">
                    <div className="max-w-2xl mx-auto">
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center gap-2">
                                <AlertTriangle size={16} />
                                {error}
                            </div>
                        )}
                        {currentStep < TOTAL_STEPS - 1 ? (
                            <button
                                onClick={nextStep}
                                className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-400 transition-colors"
                            >
                                {currentStep === 11 && !formData.coachCode ? 'Omitir y Continuar' : 'Continuar'} <ChevronRight size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-4 rounded-2xl font-black flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                        <Sparkles size={20} />
                                    </motion.div>
                                ) : (
                                    <>🚀 COMENZAR MI VIAJE</>
                                )}
                            </button>
                        )}
                    </div>
                </footer>
            </div>
        );
    } catch (renderError) {
        console.error("Critical Render Error in Onboarding:", renderError);
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-8">
                <div className="max-w-md text-center space-y-4">
                    <AlertTriangle className="text-red-500 w-16 h-16 mx-auto" />
                    <h2 className="text-2xl font-bold">Algo salió mal</h2>
                    <p className="text-slate-400">Ocurrió un error al mostrar esta pantalla.</p>
                    <div className="bg-slate-900 p-4 rounded text-left text-xs font-mono text-red-300 overflow-auto max-h-40">
                        {renderError.message}
                    </div>
                    <button
                        onClick={() => {
                            auth.signOut();
                            window.location.href = '/login';
                        }}
                        className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                        Reiniciar Aplicación
                    </button>
                </div>
            </div>
        );
    }
}

// Helper Components
function StepContainer({ icon: Icon, title, subtitle, children }) {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                    <Icon size={32} className="text-blue-400" />
                </div>
                <h2 className="text-2xl font-black mb-1">{title}</h2>
                <p className="text-slate-400 text-sm">{subtitle}</p>
            </div>
            <div>{children}</div>
        </div>
    );
}

function InputField({ label, value, onChange, placeholder, type = 'text', className = '' }) {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-xs text-slate-500 font-bold uppercase ml-1 block">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="input-field !p-4 !text-lg focus:!border-brand-indigo focus:!ring-brand-indigo/30"
            />
        </div>
    );
}

function NumberInput({ icon, label, value, onChange, optional }) {
    return (
        <div className="space-y-2">
            <label className="text-xs text-slate-500 font-bold uppercase ml-1 block flex items-center gap-2">
                {icon} {label} {optional && <span className="text-slate-700">(opcional)</span>}
            </label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="input-field !p-4 !text-xl font-bold text-center focus:!border-brand-indigo focus:!ring-brand-indigo/30"
            />
        </div>
    );
}

function SelectCard({ selected, onClick, label, icon, compact }) {
    return (
        <button
            onClick={onClick}
            className={`relative border rounded-xl transition-all text-left ${compact ? 'p-3' : 'p-4'
                } ${selected
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-900 border-white/5 text-slate-300 hover:border-white/20'
                }`}
        >
            {icon && <span className="text-lg block mb-1">{icon}</span>}
            <span className={`font-bold ${compact ? 'text-xs' : 'text-sm'}`}>{label}</span>
            {selected && (
                <div className="absolute top-2 right-2">
                    <Check size={14} />
                </div>
            )}
        </button>
    );
}

function MultiSelectCard({ selected, onClick, label }) {
    return (
        <button
            onClick={onClick}
            className={`p-3 border rounded-xl transition-all text-left flex items-center gap-3 ${selected
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                : 'bg-slate-900 border-white/5 text-slate-400'
                }`}
        >
            <div className={`w-5 h-5 rounded border flex items-center justify-center ${selected ? 'bg-blue-600 border-blue-500' : 'border-white/20'
                }`}>
                {selected && <Check size={12} />}
            </div>
            <span className="text-xs font-bold">{label}</span>
        </button>
    );
}

function GoalCard({ selected, onClick, icon, label, desc }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left w-full ${selected
                ? 'bg-blue-600 border-blue-500'
                : 'bg-slate-900/50 border-white/5 hover:border-white/20'
                }`}
        >
            <span className="text-3xl">{icon}</span>
            <div className="flex-1">
                <div className="font-bold">{label}</div>
                <div className="text-xs text-slate-400">{desc}</div>
            </div>
            {selected && <Check size={20} />}
        </button>
    );
}

function SummaryItem({ label, value }) {
    return (
        <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">{label}</div>
            <div className="font-bold text-white truncate">{value || '—'}</div>
        </div>
    );
}
