
import React, { useState } from 'react';
import { Check, Star, Zap, Shield, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { BottomNav, TopNav } from '../components/Navigation';

import { stripeService } from '../services/stripeService';

const PremiumPlans = () => {
    const { user, profile, logout } = useAuth();
    const [billingInterval, setBillingInterval] = useState('monthly'); // 'monthly' | 'yearly'
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async (priceId) => {
        setLoading(true);
        try {
            const { url } = await stripeService.createCheckoutSession(priceId);
            if (url) {
                window.location.href = url;
            } else {
                throw new Error("No URL returned from checkout session");
            }
        } catch (error) {
            console.error("Subscription Error:", error);
            alert("Error al iniciar suscripción: " + error.message);
            setLoading(false);
        }
    };

    const features = [
        { name: "Generador de Rutinas AI", free: "3 / mes", premium: "Ilimitado", icon: Zap },
        { name: "Generador de Dietas AI", free: "Básico", premium: "Personalizado", icon: Zap },
        { name: "Análisis de Progreso", free: "7 días", premium: "Histórico completo", icon: Activity },
        { name: "Herramientas Avanzadas", free: "Timer", premium: "Timer, Fotos, PDF", icon: Star },
        { name: "Gamificación", free: "Ver Rankings", premium: "Participar y Ganar", icon: Trophy },
    ];

    return (
        <div className="min-h-screen bg-slate-950 pb-20 lg:pb-0">
            <div className="hidden md:block">
                <TopNav user={user} profile={profile} onLogout={logout} />
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
                {/* Hero */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
                        Desbloquea tu Máximo Potencial
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Accede a herramientas de élite, inteligencia artificial sin límites y únete a la competición.
                    </p>
                </div>

                {/* Toggle */}
                <div className="flex justify-center">
                    <div className="bg-slate-800/50 p-1 rounded-xl flex items-center border border-white/5">
                        <button
                            onClick={() => setBillingInterval('monthly')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${billingInterval === 'monthly' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setBillingInterval('yearly')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billingInterval === 'yearly' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Anual
                            <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                -20%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8 items-start">
                    {/* Free Tier */}
                    <div className="bg-slate-900/50 rounded-3xl p-8 border border-white/5">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-white mb-2">Básico</h3>
                            <div className="flex items-end gap-1">
                                <span className="text-4xl font-bold text-white">$0</span>
                                <span className="text-slate-500 mb-1">/mes</span>
                            </div>
                            <p className="text-slate-400 text-sm mt-4">Para empezar tu viaje fitness.</p>
                        </div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-slate-300">
                                <Check size={18} className="text-slate-500" />
                                3 Rutinas IA al mes
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Check size={18} className="text-slate-500" />
                                Seguimiento básico
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Check size={18} className="text-slate-500" />
                                Comunidad (Solo lectura)
                            </li>
                        </ul>
                        <button className="w-full py-3 rounded-xl border border-white/10 text-white font-medium bg-white/5 cursor-default">
                            Plan Actual
                        </button>
                    </div>

                    {/* Premium Tier */}
                    <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-8 border border-amber-500/30 shadow-2xl shadow-amber-900/20 overflow-hidden transform md:-translate-y-4 transition-transform hover:-translate-y-6 duration-300">
                        <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-xl">
                            RECOMENDADO
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <Crown size={20} className="text-amber-400" />
                                Premium
                            </h3>
                            <div className="flex items-end gap-1">
                                <span className="text-5xl font-bold text-white">
                                    {billingInterval === 'monthly' ? '$9.99' : '$79.99'}
                                </span>
                                <span className="text-slate-500 mb-1">
                                    /{billingInterval === 'monthly' ? 'mes' : 'año'}
                                </span>
                            </div>
                            <p className="text-amber-200/60 text-sm mt-4">Para atletas comprometidos.</p>
                        </div>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-white">
                                <div className="bg-amber-500/20 p-1 rounded-full">
                                    <Check size={14} className="text-amber-400" />
                                </div>
                                <span className="font-medium">Rutinas & Dietas IA Ilimitadas</span>
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <div className="bg-amber-500/20 p-1 rounded-full">
                                    <Check size={14} className="text-amber-400" />
                                </div>
                                <span>Participa en Retos y Gana Premios</span>
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <div className="bg-amber-500/20 p-1 rounded-full">
                                    <Check size={14} className="text-amber-400" />
                                </div>
                                <span>Herramientas Pro (Fotos, PDF)</span>
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <div className="bg-amber-500/20 p-1 rounded-full">
                                    <Check size={14} className="text-amber-400" />
                                </div>
                                <span>Soporte Prioritario</span>
                            </li>
                        </ul>

                        <button
                            onClick={() => handleSubscribe(billingInterval === 'monthly' ? 'price_monthly_id' : 'price_yearly_id')}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-900/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                        >
                            <Zap size={20} className="fill-white" />
                            Obtener Premium
                        </button>
                        <p className="text-center text-xs text-slate-500 mt-4">
                            Cancela cuando quieras. Sin compromiso.
                        </p>
                    </div>
                </div>

                {/* Feature Comparison Table (Optional/Collapsed) */}
            </main>

            <BottomNav />
        </div>
    );
};

// Mock icons for the features array (if needed later)
const Activity = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
const Trophy = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>;


export default PremiumPlans;
