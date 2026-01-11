import React, { useState } from 'react';
import { Timer, Camera, Calculator, ChevronRight, Zap, Target, Sparkles, Scale, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TabataTimer from '../components/tools/TabataTimer';
import PhotoCompare from '../components/tools/PhotoCompare';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';
import { useAuth } from '../context/AuthContext';

const Tools = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [activeTool, setActiveTool] = useState(null);
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const tools = [
        {
            id: 'timer',
            name: 'Timer Tabata',
            description: 'Intervalos para HIIT y Funcional',
            icon: Timer,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            borderColor: 'border-orange-500/20'
        },
        {
            id: 'compare',
            name: 'Comparar Fotos',
            description: 'Visualiza tu evolución real',
            icon: Camera,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
            premium: true
        },
        {
            id: 'macros',
            name: 'Calc. Macros',
            description: 'Ajuste fino de nutrientes',
            icon: Calculator,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
            link: '/nutrition'
        }
    ];

    const handleToolClick = (tool) => {
        if (tool.link) {
            navigate(tool.link);
            return;
        }

        if (tool.premium && !profile?.isPremium) {
            setShowPremiumModal(true);
            return;
        }

        setActiveTool(tool.id);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white pb-32">
            {/* Header Area */}
            <header className="relative pt-12 pb-16 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -mr-48 -mt-24 pointer-events-none" />
                <div className="max-w-5xl mx-auto px-6 relative z-10">
                    <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-3 block">FitAI Ecosystem</span>
                    <h1 className="text-5xl font-black tracking-tight mb-4 tracking-tighter">Herramientas Elite</h1>
                    <p className="text-slate-400 font-medium max-w-sm">Optimiza cada detalle de tu rendimiento con utilidades de precisión física.</p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 space-y-12">
                {/* Tool Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map(tool => (
                        <motion.button
                            key={tool.id}
                            whileHover={{ y: -5, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleToolClick(tool)}
                            className={`p-8 rounded-[40px] border relative overflow-hidden text-left transition-all backdrop-blur-md flex flex-col justify-between h-56 ${activeTool === tool.id
                                    ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20'
                                    : `bg-slate-900/50 border-white/5 hover:bg-slate-900`
                                }`}
                        >
                            {/* Premium Badge */}
                            {tool.premium && (
                                <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                    <Sparkles size={10} /> {profile?.isPremium ? 'ACTIVO' : 'ELITE'}
                                </div>
                            )}

                            <div className={`w-16 h-16 rounded-[24px] ${tool.bg} ${tool.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                                <tool.icon size={32} />
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight">{tool.name}</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">{tool.description}</p>
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                    {activeTool === tool.id ? 'Herramienta Activa' : 'Abrir Herramienta'} <ChevronRight size={12} />
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* Active Tool Workspace */}
                <AnimatePresence mode="wait">
                    {activeTool ? (
                        <motion.div
                            key={activeTool}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[48px] blur-xl" />
                            <div className="relative bg-slate-900 border border-white/10 rounded-[40px] p-8 md:p-12 overflow-hidden shadow-3xl">
                                <div className="flex items-center justify-between mb-12">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/5 rounded-2xl text-indigo-400">
                                            {activeTool === 'timer' ? <Timer size={24} /> : <Camera size={24} />}
                                        </div>
                                        <h2 className="text-2xl font-black text-white tracking-tight">Espacio de Trabajo</h2>
                                    </div>
                                    <button
                                        onClick={() => setActiveTool(null)}
                                        className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white"
                                    >
                                        Cerrar herramienta
                                    </button>
                                </div>
                                <div className="max-w-2xl mx-auto">
                                    {activeTool === 'timer' && <TabataTimer />}
                                    {activeTool === 'compare' && <PhotoCompare />}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-white/[0.02] rounded-[32px] border border-white/5 flex items-center justify-center mx-auto mb-6">
                                <Zap size={32} className="text-slate-800" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight opacity-40">Selecciona una herramienta</h3>
                            <p className="text-slate-600 font-medium">Potencia tu entrenamiento con complementos integrados.</p>
                        </div>
                    )}
                </AnimatePresence>

                {/* Additional Stats / Quick Info */}
                {!activeTool && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] flex items-center gap-6">
                            <div className="p-4 bg-emerald-500/10 rounded-3xl text-emerald-400"><Scale size={32} /></div>
                            <div>
                                <h4 className="font-black text-white text-lg">Control de Peso</h4>
                                <p className="text-sm text-slate-500">Registrado recientemente: <span className="text-emerald-400 font-bold">{profile?.weight || 0} kg</span></p>
                            </div>
                        </section>
                        <section className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px] flex items-center gap-6">
                            <div className="p-4 bg-indigo-500/10 rounded-3xl text-indigo-400"><Target size={32} /></div>
                            <div>
                                <h4 className="font-black text-white text-lg">Objetivo Actual</h4>
                                <p className="text-sm text-slate-500">Estatus: <span className="text-indigo-400 font-bold uppercase">{profile?.primaryGoal || 'Mantener'}</span></p>
                            </div>
                        </section>
                    </div>
                )}
            </main>

            {/* Premium Upgrade Modal */}
            <AnimatePresence>
                {showPremiumModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
                            onClick={() => setShowPremiumModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-amber-500/30 rounded-[40px] max-w-sm w-full relative z-10 overflow-hidden shadow-2xl shadow-amber-900/20"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-10 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-white/20 rounded-[32px] flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                                    <Camera size={40} className="text-white" />
                                </div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Acceso Elite</h3>
                                <p className="text-white/80 text-sm mt-2 font-medium">Potencia tu evolución visual</p>
                            </div>
                            <div className="p-10 text-center space-y-8">
                                <p className="text-slate-300 leading-relaxed font-medium">
                                    La herramienta de <strong>Comparación de Fotos</strong> permite analizar tu progreso físico con precisión milimétrica. Exclusivo para miembros Elite.
                                </p>
                                <button
                                    onClick={() => navigate('/premium')}
                                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black tracking-widest shadow-xl shadow-orange-900/40 hover:scale-[1.02] transition-all"
                                >
                                    DESBLOQUEAR AHORA
                                </button>
                                <button
                                    onClick={() => setShowPremiumModal(false)}
                                    className="text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    Continuar con herramientas básicas
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
};

export default Tools;
