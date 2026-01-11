import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, Share, PlusSquare, X, Info } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export default function InstallAppButton() {
    const { isInstallable, isInstalled, platform, installApp } = usePWA();
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    // Si ya está instalado, no mostramos nada
    if (isInstalled) return null;

    const handleInstallClick = () => {
        if (isInstallable) {
            installApp();
        } else if (platform.isIOS) {
            setShowIOSGuide(true);
        } else {
            // Fallback para otros navegadores que no lanzan beforeinstallprompt pero son instalables manualmente
            alert("Para instalar FitAI, busca la opción 'Instalar aplicación' o 'Añadir a pantalla de inicio' en el menú de tu navegador.");
        }
    };

    return (
        <>
            <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(79, 70, 229, 0.2)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInstallClick}
                className="flex items-center gap-4 bg-slate-900 border border-brand-indigo/30 p-5 rounded-[24px] shadow-xl group transition-all w-full relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-indigo/5 to-brand-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-cyan flex items-center justify-center shadow-lg shadow-indigo-500/20 relative z-10">
                    <Download size={24} className="text-white" />
                </div>
                <div className="text-left relative z-10">
                    <p className="font-black text-white text-base tracking-tight uppercase leading-none mb-1">Instalar FitAI</p>
                    <p className="text-xs text-slate-400 font-medium tracking-tight">Acceso rápido desde tu inicio</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {platform.isIOS && (
                        <div className="bg-brand-indigo/10 text-brand-indigo px-2 py-1 rounded-md text-[10px] font-black uppercase">iOS</div>
                    )}
                    <Smartphone size={20} className="text-brand-indigo group-hover:scale-110 transition-transform relative z-10" />
                </div>
            </motion.button>

            {/* Guía para iOS */}
            <AnimatePresence>
                {showIOSGuide && (
                    <div className="fixed inset-0 z-[200] flex items-end justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
                            onClick={() => setShowIOSGuide(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="bg-slate-900 border border-white/10 rounded-t-[32px] w-full max-w-lg p-8 relative z-10 shadow-2xl"
                        >
                            <div className="bg-noise" />
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-brand-indigo/20 rounded-2xl">
                                        <Info className="text-brand-indigo" size={24} />
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Instalar en iOS</h3>
                                </div>
                                <button onClick={() => setShowIOSGuide(false)} className="p-2 bg-slate-800 rounded-full text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-5 bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                                    <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
                                        <Share size={20} className="text-blue-400" />
                                    </div>
                                    <p className="text-sm text-slate-200">
                                        Toca el botón <span className="font-bold text-white">Compartir</span> en la barra inferior de Safari.
                                    </p>
                                </div>

                                <div className="flex items-center gap-5 bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                                    <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
                                        <PlusSquare size={20} className="text-brand-cyan" />
                                    </div>
                                    <p className="text-sm text-slate-200">
                                        Desliza hacia abajo y selecciona <span className="font-bold text-white">"Añadir a pantalla de inicio"</span>.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowIOSGuide(false)}
                                className="btn-brand w-full mt-8 py-4 font-black text-sm tracking-widest uppercase"
                            >
                                ENTENDIDO
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
