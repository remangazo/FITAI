/**
 * TrainerOnboarding - Registration flow for becoming a Trainer/Coach
 * 
 * Steps:
 * 1. Personal Info (name, bio, photo)
 * 2. Specialties (multiselect)
 * 3. Certifications (optional)
 * 4. Code Generation (show unique coach code)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, User, Award, Sparkles, Copy, Check,
    Dumbbell, Heart, Zap, Flame, Timer, Scale, Target, Brain,
    Trophy, GraduationCap, Shield, CheckCircle2, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { trainerService } from '../services/trainerService';

const TOTAL_STEPS = 4;

const SPECIALTIES = [
    { id: 'hipertrofia', label: 'Hipertrofia', icon: Dumbbell, color: 'blue' },
    { id: 'fuerza', label: 'Fuerza', icon: Zap, color: 'yellow' },
    { id: 'crossfit', label: 'CrossFit', icon: Flame, color: 'orange' },
    { id: 'funcional', label: 'Funcional', icon: Target, color: 'green' },
    { id: 'perdida_peso', label: 'Pérdida de Peso', icon: Scale, color: 'purple' },
    { id: 'cardio', label: 'Cardio', icon: Heart, color: 'red' },
    { id: 'resistencia', label: 'Resistencia', icon: Timer, color: 'cyan' },
    { id: 'calistenia', label: 'Calistenia', icon: Trophy, color: 'indigo' },
    { id: 'rehabilitacion', label: 'Rehabilitación', icon: Shield, color: 'emerald' },
    { id: 'nutricion', label: 'Nutrición', icon: Brain, color: 'pink' },
];

const CERTIFICATIONS = [
    'Personal Trainer Certificado',
    'Licenciado en Educación Física',
    'CrossFit Level 1-3',
    'NSCA-CPT',
    'ACE Certified',
    'Nutricionista Deportivo',
    'Especialista en Rehabilitación',
    'Instructor de Yoga/Pilates',
    'Técnico en Musculación',
    'Otro (especificar)',
];

export default function TrainerOnboarding() {
    const navigate = useNavigate();
    const { user, profile, updateProfile, loading } = useAuth();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [coachCode, setCoachCode] = useState('');
    const [copied, setCopied] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login?redirect=/become-trainer');
        }
    }, [user, loading, navigate]);

    const [formData, setFormData] = useState({
        displayName: profile?.displayName || profile?.name || user?.displayName || '',
        bio: '',
        photoURL: profile?.photoURL || user?.photoURL || '',
        specialties: [],
        certifications: [],
        customCertification: '',
    });

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleSpecialty = (id) => {
        setFormData(prev => ({
            ...prev,
            specialties: prev.specialties.includes(id)
                ? prev.specialties.filter(s => s !== id)
                : [...prev.specialties, id]
        }));
    };

    const toggleCertification = (cert) => {
        setFormData(prev => ({
            ...prev,
            certifications: prev.certifications.includes(cert)
                ? prev.certifications.filter(c => c !== cert)
                : [...prev.certifications, cert]
        }));
    };

    const nextStep = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = async () => {
        if (!user) {
            alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
            navigate('/login');
            return;
        }
        setIsLoading(true);
        try {
            // Register as trainer
            const result = await trainerService.registerAsTrainer(user.uid, {
                displayName: formData.displayName,
                bio: formData.bio,
                photoURL: formData.photoURL,
                specialties: formData.specialties,
                certifications: formData.certifications.includes('Otro (especificar)')
                    ? [...formData.certifications.filter(c => c !== 'Otro (especificar)'), formData.customCertification]
                    : formData.certifications,
            });

            setCoachCode(result.coachCode);

            // Update user profile with trainer role
            await updateProfile({
                role: 'trainer',
                displayName: formData.displayName,
            });

            nextStep();
        } catch (error) {
            console.error('Error registering as trainer:', error);
            alert('Error al registrar como entrenador: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(coachCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const goToDashboard = () => {
        navigate('/trainer');
    };

    const progress = (step / TOTAL_STEPS) * 100;

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-lg border-b border-white/5 p-4">
                <div className="flex items-center justify-between max-w-xl mx-auto">
                    <button
                        onClick={() => step > 1 ? prevStep() : navigate(-1)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <GraduationCap className="text-blue-400" size={20} />
                        <span className="font-bold">Convertite en Trainer</span>
                    </div>
                    <div className="text-sm text-slate-500">
                        {step}/{TOTAL_STEPS}
                    </div>
                </div>
                {/* Progress bar */}
                <div className="w-full max-w-xl mx-auto mt-4 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 max-w-xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <StepContainer key="step1" icon={User} title="Tu Perfil de Trainer" subtitle="Esta información será visible para tus alumnos">
                            <div className="space-y-6">
                                {/* Photo placeholder */}
                                <div className="flex justify-center">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-4xl font-black">
                                        {formData.displayName ? formData.displayName[0].toUpperCase() : 'T'}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-slate-400 mb-2 block">Nombre (visible para alumnos)</label>
                                        <input
                                            type="text"
                                            value={formData.displayName}
                                            onChange={(e) => updateField('displayName', e.target.value)}
                                            placeholder="Ej: Profe Juan"
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400 mb-2 block">Bio / Descripción</label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => updateField('bio', e.target.value)}
                                            placeholder="Contá un poco sobre vos y tu experiencia..."
                                            rows={4}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </StepContainer>
                    )}

                    {step === 2 && (
                        <StepContainer key="step2" icon={Dumbbell} title="Tus Especialidades" subtitle="Seleccioná en qué áreas te especializás">
                            <div className="grid grid-cols-2 gap-3">
                                {SPECIALTIES.map(spec => {
                                    const Icon = spec.icon;
                                    const selected = formData.specialties.includes(spec.id);
                                    return (
                                        <motion.button
                                            key={spec.id}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => toggleSpecialty(spec.id)}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${selected
                                                ? 'border-blue-500 bg-blue-500/20'
                                                : 'border-white/10 bg-slate-900 hover:border-white/20'
                                                }`}
                                        >
                                            <Icon size={24} className={selected ? 'text-blue-400' : 'text-slate-400'} />
                                            <span className={`text-sm font-bold ${selected ? 'text-white' : 'text-slate-300'}`}>
                                                {spec.label}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                            {formData.specialties.length === 0 && (
                                <p className="text-center text-slate-500 text-sm mt-4">Seleccioná al menos una especialidad</p>
                            )}
                        </StepContainer>
                    )}

                    {step === 3 && (
                        <StepContainer key="step3" icon={Award} title="Certificaciones" subtitle="Opcional: Agregá tus credenciales">
                            <div className="space-y-3">
                                {CERTIFICATIONS.map(cert => {
                                    const selected = formData.certifications.includes(cert);
                                    return (
                                        <motion.button
                                            key={cert}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => toggleCertification(cert)}
                                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${selected
                                                ? 'border-green-500 bg-green-500/20'
                                                : 'border-white/10 bg-slate-900 hover:border-white/20'
                                                }`}
                                        >
                                            <span className={`font-medium ${selected ? 'text-white' : 'text-slate-300'}`}>
                                                {cert}
                                            </span>
                                            {selected && <CheckCircle2 className="text-green-400" size={20} />}
                                        </motion.button>
                                    );
                                })}

                                {formData.certifications.includes('Otro (especificar)') && (
                                    <input
                                        type="text"
                                        value={formData.customCertification}
                                        onChange={(e) => updateField('customCertification', e.target.value)}
                                        placeholder="Especificá tu certificación..."
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                                    />
                                )}
                            </div>
                            <p className="text-center text-slate-500 text-sm mt-4">
                                Podés omitir este paso si no tenés certificaciones formales
                            </p>
                        </StepContainer>
                    )}

                    {step === 4 && (
                        <StepContainer key="step4" icon={Sparkles} title="¡Ya sos Trainer!" subtitle="Compartí tu código con tus alumnos">
                            <div className="space-y-6">
                                {/* Success Animation */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 12 }}
                                    className="flex justify-center"
                                >
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                        <CheckCircle2 size={64} className="text-white" />
                                    </div>
                                </motion.div>

                                {/* Coach Code Display */}
                                <div className="bg-slate-900 rounded-2xl p-6 border border-blue-500/30">
                                    <p className="text-center text-slate-400 text-sm mb-3">Tu Código de Coach</p>
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-2xl font-mono font-black text-blue-400 tracking-wider">
                                            {coachCode}
                                        </span>
                                        <button
                                            onClick={copyCode}
                                            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                        >
                                            {copied ? <Check size={18} /> : <Copy size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 rounded-xl p-4 text-sm text-slate-400">
                                    <p className="font-bold text-white mb-2">¿Cómo funciona?</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Compartí este código con tus alumnos</li>
                                        <li>Ellos lo ingresan al registrarse en FITAI</li>
                                        <li>Automáticamente los verás en tu Dashboard</li>
                                        <li>Podés asignarles rutinas y ver su progreso</li>
                                    </ul>
                                </div>

                                <button
                                    onClick={goToDashboard}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl font-black text-lg flex items-center justify-center gap-2"
                                >
                                    Ir a mi Dashboard <ChevronRight size={20} />
                                </button>
                            </div>
                        </StepContainer>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            {step < 4 && (
                <div className="sticky bottom-0 p-6 bg-slate-950/95 border-t border-white/5">
                    <div className="max-w-xl mx-auto">
                        <button
                            onClick={step === 3 ? handleSubmit : nextStep}
                            disabled={isLoading || (step === 1 && !formData.displayName) || (step === 2 && formData.specialties.length === 0)}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl font-black text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Procesando...
                                </>
                            ) : step === 3 ? (
                                'Completar Registro'
                            ) : (
                                <>
                                    Continuar <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper component for step containers
function StepContainer({ icon: Icon, title, subtitle, children }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <div className="text-center space-y-2">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                        <Icon size={32} className="text-blue-400" />
                    </div>
                </div>
                <h2 className="text-2xl font-black">{title}</h2>
                <p className="text-slate-400">{subtitle}</p>
            </div>
            {children}
        </motion.div>
    );
}
