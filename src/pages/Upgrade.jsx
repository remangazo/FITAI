/**
 * Upgrade Page
 * 
 * Página de suscripción Premium con planes y beneficios.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Crown, Check, Sparkles, ArrowLeft, Dumbbell, Brain,
    FileText, ShoppingBag, Truck, Tag, History, TrendingUp,
    Star, Shield, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../hooks/usePremium';
import { initMercadoPago } from '@mercadopago/sdk-react';

// Initialize MP with Public Key
initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || 'TEST-YOUR-PUBLIC-KEY');

const API_BASE = import.meta.env.VITE_FUNCTIONS_URL || 'https://us-central1-fitai-dev.cloudfunctions.net';
const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || 'TEST-YOUR-PUBLIC-KEY';

const benefits = [
    { icon: Dumbbell, text: 'Rutinas ilimitadas', free: '1/mes', premium: 'Ilimitadas' },
    { icon: Brain, text: 'AI Coach completo', free: 'Básico', premium: 'Avanzado' },
    { icon: History, text: 'Historial de entrenos', free: '14 días', premium: 'Ilimitado' },
    { icon: FileText, text: 'Exportar a PDF', free: '❌', premium: '✅' },
    { icon: TrendingUp, text: 'Gráficos de progresión', free: '❌', premium: '✅' },
    { icon: Tag, text: 'Descuento en tienda', free: '0%', premium: '10%' },
    { icon: Truck, text: 'Envío gratis (+$30)', free: '❌', premium: '✅' },
    { icon: ShoppingBag, text: 'Productos exclusivos', free: '❌', premium: '✅' }
];

export default function Upgrade() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isPremium } = usePremium();
    const [selectedPlan, setSelectedPlan] = useState('annual');
    const [loading, setLoading] = useState(false);

    const plans = {
        monthly: {
            id: 'monthly',
            name: 'Mensual',
            price: 4.99,
            period: '/mes',
            savings: null
        },
        annual: {
            id: 'annual',
            name: 'Anual',
            price: 39.99,
            period: '/año',
            monthlyEquivalent: 3.33,
            savings: '33%'
        }
    };

    const handleSubscribe = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_BASE}/createCheckoutSession`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    plan: selectedPlan
                })
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error) {
            console.error('[Upgrade] Stripe Error:', error);
            alert('Error al procesar con Stripe. Intenta con Mercado Pago.');
        } finally {
            setLoading(false);
        }
    };

    const handleMercadoPago = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_BASE}/createMPPreference`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    plan: selectedPlan
                })
            });

            const { preferenceId } = await response.json();

            if (preferenceId) {
                // Open MP Checkout Pro Modal using the global window.MercadoPago
                const mp = new window.MercadoPago(MP_PUBLIC_KEY, {
                    locale: 'es-AR'
                });

                mp.checkout({
                    preference: {
                        id: preferenceId
                    },
                    autoOpen: true
                });
            } else {
                throw new Error('El servidor no devolvió una Preferencia válida.');
            }
        } catch (error) {
            console.error('[Upgrade] Mercado Pago Error:', error);
            // Si el error es de conexión o falta de llaves, informamos claramente
            alert(`Error de Conexión o Configuración:\n\nNo se pudo iniciar Mercado Pago. Detalles: ${error.message}\n\nSi estás en desarrollo, asegúrate de tener las credenciales en .env y las funciones desplegadas.`);
        } finally {
            setLoading(false);
        }
    };

    if (isPremium) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                        <Crown size={40} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">¡Ya sos Premium!</h1>
                    <p className="text-slate-400 mb-6">
                        Disfrutá de todos los beneficios exclusivos.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                        Volver al Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <div className="p-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                    Volver
                </button>
            </div>

            <div className="max-w-4xl mx-auto px-4 pb-12">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 bg-brand-indigo/10 border border-brand-indigo/30 px-5 py-2 rounded-full mb-8 shadow-lg shadow-indigo-500/10">
                        <Sparkles className="text-brand-indigo" size={18} />
                        <span className="text-xs font-black text-brand-indigo uppercase tracking-widest">Membresía Elite</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase leading-[0.9]">
                        TU POTENCIAL,<br />
                        <span className="title-brand">SIN LÍMITES.</span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                        Desbloquea el poder absoluto de la IA. Planes ilimitados, análisis biomecánico avanzado y acceso prioritario al ecosistema FitAI.
                    </p>
                </motion.div>

                {/* Side-by-Side Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Free Plan Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass p-8 rounded-[32px] border border-white/5 bg-slate-900/40 relative group"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/5 transition-colors group-hover:bg-slate-700">
                                <Dumbbell size={32} className="text-slate-500" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tight">PLAN FREE</h3>
                            <div className="text-4xl font-black mt-3 text-white">$0<span className="text-lg font-normal text-slate-600">/siempre</span></div>
                            <p className="text-sm text-slate-500 mt-2 font-bold uppercase tracking-wider">Esencial</p>
                        </div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" /> 1 rutina por mes
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" /> AI Coach básico
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Historial 14 días
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-600 font-medium line-through">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" /> Exportar a PDF
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-600 font-medium line-through">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" /> Descuentos tienda
                            </li>
                        </ul>
                        <div className="text-center text-xs font-black text-slate-600 bg-slate-800/50 py-2 rounded-lg border border-white/5">
                            ACTUAL
                        </div>
                    </motion.div>

                    {/* Premium Plan Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="card-elite p-8 relative overflow-hidden group border-brand-indigo/50"
                    >
                        <div className="bg-noise opacity-20" />
                        <div className="absolute top-4 right-4 bg-brand-indigo text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-brand-indigo/50 z-20 uppercase tracking-widest">
                            BEST SELLER
                        </div>
                        <div className="text-center mb-8 relative z-10">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand-indigo to-brand-cyan rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-500">
                                <Crown size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-black title-brand uppercase tracking-tight">PLAN ELITE</h3>
                            <div className="text-4xl font-black mt-3 text-white">$4.99<span className="text-lg font-normal text-slate-400">/mes</span></div>
                            <p className="text-sm text-brand-cyan mt-2 font-bold uppercase tracking-wider">Poder Ilimitado</p>
                        </div>
                        <ul className="space-y-4 mb-8 relative z-10">
                            <li className="flex items-center gap-3 text-sm text-white font-bold">
                                <Check size={18} className="text-brand-cyan" strokeWidth={3} /> Rutinas ilimitadas
                            </li>
                            <li className="flex items-center gap-3 text-sm text-white font-bold">
                                <Check size={18} className="text-brand-cyan" strokeWidth={3} /> Elite AI Coach
                            </li>
                            <li className="flex items-center gap-3 text-sm text-white font-bold">
                                <Check size={18} className="text-brand-cyan" strokeWidth={3} /> Historial ilimitado
                            </li>
                            <li className="flex items-center gap-3 text-sm text-white font-bold">
                                <Check size={18} className="text-brand-cyan" strokeWidth={3} /> Exportar a PDF
                            </li>
                            <li className="flex items-center gap-3 text-sm text-white font-bold">
                                <Check size={18} className="text-brand-cyan" strokeWidth={3} /> 10% Descuento tienda
                            </li>
                            <li className="flex items-center gap-3 text-sm text-white font-bold">
                                <Check size={18} className="text-brand-cyan" strokeWidth={3} /> Envío gratis (+$30)
                            </li>
                        </ul>
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(79, 70, 229, 0.4)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedPlan('monthly')}
                            className="btn-brand w-full py-4 text-base relative z-10"
                        >
                            ELEVAR NIVEL AHORA
                        </motion.button>
                    </motion.div>
                </div>

                {/* Billing Period Selector */}
                <div className="text-center mb-6">
                    <p className="text-sm text-slate-400 mb-3">Elegí tu período de facturación:</p>
                </div>
                <div className="flex justify-center gap-4 mb-8">
                    {Object.values(plans).map((plan) => (
                        <motion.button
                            key={plan.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedPlan(plan.id)}
                            className={`relative px-6 py-4 rounded-2xl border-2 transition-all ${selectedPlan === plan.id
                                ? 'border-amber-500 bg-amber-500/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                }`}
                        >
                            {plan.savings && (
                                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    -{plan.savings}
                                </span>
                            )}
                            <div className="text-sm text-slate-400">{plan.name}</div>
                            <div className="text-2xl font-bold">
                                ${plan.price}
                                <span className="text-sm font-normal text-slate-500">{plan.period}</span>
                            </div>
                            {plan.monthlyEquivalent && (
                                <div className="text-xs text-green-400">
                                    ${plan.monthlyEquivalent}/mes
                                </div>
                            )}
                        </motion.button>
                    ))}
                </div>

                {/* Benefits Comparison */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-900/50 rounded-3xl border border-white/10 overflow-hidden mb-8"
                >
                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/50 border-b border-white/10">
                        <div className="font-bold text-slate-400">Beneficio</div>
                        <div className="text-center font-bold text-slate-400">Free</div>
                        <div className="text-center font-bold text-amber-400">Premium</div>
                    </div>

                    {benefits.map((benefit, idx) => (
                        <div
                            key={idx}
                            className="grid grid-cols-3 gap-4 p-4 border-b border-white/5 last:border-0"
                        >
                            <div className="flex items-center gap-2">
                                <benefit.icon size={18} className="text-slate-400" />
                                <span className="text-sm">{benefit.text}</span>
                            </div>
                            <div className="text-center text-slate-500">{benefit.free}</div>
                            <div className="text-center text-green-400 font-medium">{benefit.premium}</div>
                        </div>
                    ))}
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                >
                    <div className="max-w-md mx-auto space-y-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleMercadoPago}
                            disabled={loading}
                            className="w-full bg-[#009EE3] hover:bg-[#0086C3] text-white font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <svg className="h-6 w-auto" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M78.6 33c0 10.4-8.4 18.8-18.8 18.8S41 43.4 41 33s8.4-18.8 18.8-18.8S78.6 22.6 78.6 33z" fill="#FFF" />
                                        <path d="M59.8 16c-9.4 0-17 7.6-17 17s7.6 17 17 17 17-7.6 17-17-7.6-17-17-17zm0 30.2c-7.3 0-13.2-5.9-13.2-13.2s5.9-13.2 13.2-13.2 13.2 5.9 13.2 13.2-5.9 13.2-13.2 13.2z" fill="#009EE3" />
                                        <path d="M37.8 16.5h-5.9v33h5.9l8.6-16.5-8.6-16.5z" fill="#FFF" />
                                        <path d="M31.9 16.5H26v33h5.9V16.5z" fill="#FFF" />
                                    </svg>
                                    <span>Pagar con Mercado Pago</span>
                                </>
                            )}
                        </motion.button>

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px flex-1 bg-white/10" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Otras opciones</span>
                            <div className="h-px flex-1 bg-white/10" />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-2xl flex items-center justify-center gap-2 border border-white/5 disabled:opacity-50"
                        >
                            <Shield size={16} className="text-slate-400" />
                            <span className="text-sm">Tarjeta Internacional (Stripe)</span>
                        </motion.button>
                    </div>

                    <div className="flex items-center justify-center gap-4 mt-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                            <Shield size={14} />
                            Pago seguro
                        </div>
                        <div className="flex items-center gap-1">
                            <Zap size={14} />
                            Activo al instante
                        </div>
                        <div className="flex items-center gap-1">
                            <Check size={14} />
                            Cancela cuando quieras
                        </div>
                    </div>
                </motion.div>

                {/* Trial info */}
                <p className="text-center text-slate-500 text-sm mt-8">
                    7 días de prueba gratis • Sin cargo hasta que termine el trial
                </p>
            </div>
        </div>
    );
}
