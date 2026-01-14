import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Mail, Lock, User, ArrowLeft, Loader2, Eye, EyeOff, Zap, Target, TrendingUp, ShoppingCart } from 'lucide-react';

export default function Login() {
    const { loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword, user, profile, loading: authLoading, profileLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectPath = searchParams.get('redirect');
    const { t, i18n } = useTranslation();

    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Redirigir solo cuando tengamos certeza del usuario y su perfil
        if (user && !authLoading && !profileLoading) {
            // Si hay un path de redirección pendiente, lo priorizamos
            if (redirectPath) {
                navigate(redirectPath);
                return;
            }

            if (profile) {
                if (profile.onboardingCompleted) {
                    navigate('/dashboard');
                } else {
                    navigate('/onboarding');
                }
            } else {
                console.warn("Usuario autenticado sin perfil, redirigiendo a onboarding...");
                navigate('/onboarding');
            }
        }
    }, [user, profile, authLoading, profileLoading, navigate, redirectPath]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (mode === 'login') {
                await loginWithEmail(email, password);
            } else if (mode === 'signup') {
                await signupWithEmail(email, password, name);
                // navigate handled by useEffect logic
            } else if (mode === 'reset') {
                await resetPassword(email);
                setMessage(t('auth.reset_sent', 'Email de recuperación enviado'));
                setMode('login');
            }
        } catch (err) {
            const errorMessages = {
                'auth/user-not-found': t('auth.error_user_not_found', 'Usuario no encontrado'),
                'auth/wrong-password': t('auth.error_wrong_password', 'Contraseña incorrecta'),
                'auth/email-already-in-use': t('auth.error_email_in_use', 'Email ya registrado'),
                'auth/weak-password': t('auth.error_weak_password', 'Mínimo 6 caracteres'),
                'auth/invalid-email': t('auth.error_invalid_email', 'Email inválido'),
                'auth/invalid-credential': t('auth.error_wrong_password', 'Credenciales inválidas'),
            };
            setError(errorMessages[err.code] || err.message);
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: Zap, text: 'Rutinas personalizadas con IA', color: 'text-blue-400' },
        { icon: User, text: 'Modo Entrenador: Gestiona alumnos', color: 'text-purple-400' },
        { icon: ShoppingCart, text: 'Tienda Oficial integrada', color: 'text-amber-400' },
    ];

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950">
                <div className="bg-noise opacity-20" />

                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-indigo/20 rounded-full blur-[120px] animate-pulse-slow" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-brand-cyan/15 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
                </div>

                <div className="relative z-10 flex flex-col justify-center items-start p-20 max-w-2xl">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex items-center gap-5 mb-16"
                    >
                        <div className="p-4 rounded-[24px] bg-gradient-to-br from-brand-indigo to-brand-cyan shadow-2xl shadow-indigo-500/40">
                            <Dumbbell size={40} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-tight mb-0.5">FitAI</h1>
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-12 bg-gradient-to-r from-brand-indigo to-brand-cyan rounded-full" />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Personal Trainer</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h2 className="text-6xl font-black text-white leading-[0.95] mb-10 tracking-tighter">
                            TU CUERPO,<br />
                            <span className="title-brand !from-brand-cyan !to-brand-indigo uppercase">REFORMULADO.</span>
                        </h2>
                        <p className="text-xl text-slate-400 mb-12 font-medium leading-relaxed">
                            Experimenta la próxima generación de fitness impulsada por inteligencia artificial.
                            Rutinas y planes nutricionales creados exclusivamente para tu ADN deportivo.
                        </p>
                    </motion.div>

                    {/* Features */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="grid grid-cols-1 gap-6"
                    >
                        {features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-5 group">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-brand-indigo/50 transition-all duration-500">
                                    <feature.icon size={24} className={`${feature.color} group-hover:scale-110 transition-transform`} />
                                </div>
                                <span className="text-lg font-bold text-slate-200 tracking-tight">{feature.text}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ background: '#0a0a0f' }}>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Language Toggle */}
                    <div className="flex justify-end mb-8">
                        <button
                            onClick={() => i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')}
                            className="px-4 py-2 rounded-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            {i18n.language === 'es' ? '🇺🇸 EN' : '🇦🇷 ES'}
                        </button>
                    </div>

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-4 mb-10">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-cyan shadow-lg shadow-indigo-500/20">
                            <Dumbbell size={28} className="text-white" />
                        </div>
                        <span className="title-brand text-3xl uppercase tracking-tighter">FitAI</span>
                    </div>

                    {/* Form Header */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {mode === 'login' && t('auth.login', 'Iniciar Sesión')}
                            {mode === 'signup' && t('auth.signup', 'Crear Cuenta')}
                            {mode === 'reset' && t('auth.reset_tagline', 'Recuperar Cuenta')}
                        </h2>
                        <p className="text-gray-400">
                            {mode === 'login' && t('auth.login_tagline', 'Bienvenido de vuelta')}
                            {mode === 'signup' && t('auth.signup_tagline', 'Comienza tu transformación')}
                            {mode === 'reset' && 'Te enviaremos un email de recuperación'}
                        </p>
                    </div>

                    {/* Error/Message Display */}
                    <AnimatePresence>
                        {redirectPath === '/become-trainer' && !user && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 rounded-xl bg-brand-indigo/10 border border-brand-indigo/30 text-brand-indigo text-sm flex items-center gap-3"
                            >
                                <Zap size={18} className="text-brand-cyan" />
                                <div>
                                    <p className="font-bold">Modo Entrenador Elite</p>
                                    <p className="opacity-80">Inicia sesión para comenzar tu registro como partner.</p>
                                </div>
                            </motion.div>
                        )}
                        {profileLoading && user && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm flex items-center gap-2"
                            >
                                <Loader2 className="animate-spin" size={16} />
                                Preparando tu espacio personal...
                            </motion.div>
                        )}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm"
                            >
                                {message}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {mode === 'signup' && (
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="text"
                                    placeholder={t('auth.name', 'Nombre')}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input-field input-with-icon"
                                />
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <input
                                type="email"
                                placeholder={t('auth.email', 'Correo electrónico')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="input-field input-with-icon"
                            />
                        </div>

                        {mode !== 'reset' && (
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={t('auth.password', 'Contraseña')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="input-field input-with-icon pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        )}

                        {mode === 'login' && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => setMode('reset')}
                                    className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                                >
                                    {t('auth.forgot_password', '¿Olvidaste tu contraseña?')}
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-brand w-full py-4 text-lg"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    {mode === 'login' && t('auth.login', 'INICIAR SESIÓN')}
                                    {mode === 'signup' && t('auth.signup', 'CREAR CUENTA')}
                                    {mode === 'reset' && t('auth.send_reset', 'ENVIAR EMAIL')}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    {mode !== 'reset' && (
                        <div className="divider-with-text my-8">
                            <span>{t('auth.or', 'o continúa con')}</span>
                        </div>
                    )}

                    {/* Google Login */}
                    {mode !== 'reset' && (
                        <button
                            onClick={loginWithGoogle}
                            className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-gray-100 transition-all"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            {t('auth.google_login', 'Continuar con Google')}
                        </button>
                    )}

                    {/* Mode Toggle */}
                    <div className="mt-8 text-center">
                        {mode === 'login' && (
                            <p className="text-gray-400">
                                ¿No tienes cuenta?{' '}
                                <button onClick={() => setMode('signup')} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                    Regístrate
                                </button>
                            </p>
                        )}
                        {mode === 'signup' && (
                            <p className="text-gray-400">
                                ¿Ya tienes cuenta?{' '}
                                <button onClick={() => setMode('login')} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                    Inicia sesión
                                </button>
                            </p>
                        )}
                        {mode === 'reset' && (
                            <button onClick={() => setMode('login')} className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2 mx-auto transition-colors">
                                <ArrowLeft size={16} />
                                Volver al inicio
                            </button>
                        )}
                    </div>

                    {/* Trainer CTA */}
                    <div className="mt-6 text-center border-t border-white/5 pt-6">
                        <p className="text-gray-500 text-xs mb-2">¿Eres un profesional del fitness?</p>
                        <button
                            onClick={() => navigate('/become-trainer')}
                            className="text-brand-indigo hover:text-brand-violet font-bold text-sm transition-colors uppercase tracking-wider"
                        >
                            Únete como Entrenador Elite
                        </button>
                    </div>

                    {/* Terms */}
                    <p className="mt-6 text-xs text-gray-500 text-center">
                        {t('auth.terms', 'Al continuar, aceptas nuestros términos y condiciones.')}
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
