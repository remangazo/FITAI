import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Home, Dumbbell, Users, ShoppingBag, User, ChevronLeft, Settings, Menu, UtensilsCrossed, TrendingUp
} from 'lucide-react';

// Bottom Navigation for Mobile
export function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', icon: Home, label: 'Panel' },
        { path: '/routines', icon: Dumbbell, label: 'Entreno' },
        { path: '/nutrition', icon: UtensilsCrossed, label: 'Dieta' },
        { path: '/progress', icon: TrendingUp, label: 'Progreso' },
        { path: '/community', icon: Users, label: 'Social' },
        { path: '/shop', icon: ShoppingBag, label: 'Tienda' },
        { path: '/tools', icon: Settings, label: 'Tools' },
        { path: '/profile', icon: User, label: 'Perfil' }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="bg-slate-950/90 backdrop-blur-xl border-t border-white/5 px-2 pb-safe">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path === '/dashboard' && location.pathname === '/');
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className="flex flex-col items-center justify-center w-16 h-full relative"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="bottomNavIndicator"
                                        className="absolute top-0 w-8 h-1 bg-brand-indigo rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                                    />
                                )}
                                <item.icon
                                    size={22}
                                    className={`transition-all duration-300 ${isActive ? 'text-brand-indigo scale-110' : 'text-slate-500'}`}
                                />
                                <span className={`text-[10px] mt-1 font-extrabold uppercase tracking-tight ${isActive ? 'text-slate-200' : 'text-slate-600'}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}

// Back Button Component
export function BackButton({ to, label = 'Volver' }) {
    const navigate = useNavigate();

    const handleBack = () => {
        // Use startTransition for smoother navigation
        React.startTransition(() => {
            if (to) {
                navigate(to, { replace: false });
            } else {
                navigate(-1);
            }
        });
    };

    return (
        <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
            <div className="bg-slate-800 p-2 rounded-xl group-hover:bg-slate-700 transition-colors">
                <ChevronLeft size={20} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider hidden sm:inline">{label}</span>
        </button>
    );
}

// Page Header Component with Back Button
export function PageHeader({ title, subtitle, showBack = true, backTo, actions }) {
    return (
        <header className="flex flex-col gap-4 mb-8">
            <div className="flex items-center justify-between">
                {showBack && <BackButton to={backTo} />}
                {actions && <div className="flex gap-3">{actions}</div>}
            </div>
            <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">{title}</h1>
                {subtitle && <p className="text-slate-400 mt-1">{subtitle}</p>}
            </div>
        </header>
    );
}

// Top Navbar for Desktop
export function TopNav({ user, profile, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();

    const navLinks = [
        { path: '/dashboard', label: 'PANEL' },
        { path: '/routines', label: 'ENTRENO' },
        { path: '/nutrition', label: 'DIETA' },
        { path: '/progress', label: 'PROGRESO' },
        { path: '/tools', label: 'TOOLS' },
        { path: '/community', label: 'SOCIAL' },
        { path: '/shop', label: 'TIENDA' }
    ];

    return (
        <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-brand-indigo to-brand-cyan p-2.5 rounded-xl shadow-lg shadow-indigo-500/10">
                        <Dumbbell size={20} className="text-white" />
                    </div>
                    <span className="title-brand text-2xl uppercase tracking-tighter">FitAI</span>
                    {profile?.isPremium && (
                        <span className="badge-premium">ELITE</span>
                    )}
                </div>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-10">
                    {navLinks.map(link => (
                        <button
                            key={link.path}
                            onClick={() => navigate(link.path)}
                            className={`text-sm font-extrabold tracking-tight transition-all relative ${location.pathname === link.path ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {link.label}
                            {location.pathname === link.path && (
                                <motion.div
                                    layoutId="navIndicator"
                                    className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-brand-indigo shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/settings')}
                        className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5"
                    >
                        <Settings size={18} />
                    </button>
                    <div className="h-8 w-[1px] bg-white/5 hidden md:block" />
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm"
                    >
                        {user?.displayName?.charAt(0) || 'U'}
                    </button>
                </div>
            </div>
        </nav>
    );
}

// Main Layout Wrapper
export function AppLayout({ children }) {
    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20 md:pb-0">
            {children}
            <BottomNav />
        </div>
    );
}
