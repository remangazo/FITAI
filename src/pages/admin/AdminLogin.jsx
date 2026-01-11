import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function AdminLogin() {
    const { loginWithEmail, logout } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Authenticate
            const result = await loginWithEmail(email, password);
            const user = result.user; // Get user object

            // 2. Fetch Profile to check Role (AuthContext usually handles this but we need immediate check)
            // We'll rely on a quick check or wait for the context to sync. 
            // Better strategy: Navigate to store, let StoreAdmin do the check. 
            // BUT, to be "Portal" like, we should check here if possible or catch the redirect.

            // For now, simple navigation. StoreAdmin will bounce them back if not admin.
            // Ideally we'd fetch the doc here to show "Unauthorized" before navigating.

            navigate('/crm/store');

        } catch (err) {
            console.error(err);
            setError('Credenciales inválidas o error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo / Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 mb-4 shadow-xl">
                        <ShieldCheck size={32} className="text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">FitAI <span className="text-slate-500">OpsCenter</span></h1>
                    <p className="text-slate-500 text-sm mt-2">Portal de Administración Exclusivo</p>
                </div>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl"
                >
                    <form onSubmit={handleAdminLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
                                <AlertTriangle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID de Operador</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    placeholder="admin@fitai.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clave de Acceso</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'ACCEDER AL SISTEMA'}
                        </button>
                    </form>
                </motion.div>

                <p className="text-center text-slate-600 text-xs mt-8">
                    Acceso restringido. Todas las actividades son monitoreadas.
                </p>
            </div>
        </div>
    );
}
