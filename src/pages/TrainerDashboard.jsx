/**
 * TrainerDashboard - Main dashboard for trainers to manage their students
 * 
 * Features:
 * - Overview statistics
 * - Student list with progress
 * - Team leaderboard
 * - Rewards status
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Trophy, Dumbbell, Star, ChevronRight, Copy, Check,
    TrendingUp, Award, Crown, Search, Filter, Loader2, UserPlus,
    Target, Flame, BarChart3, Settings, RefreshCw, Plus, Calendar, Flag,
    Gift, Zap, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { trainerService, TRAINER_LEVELS, REWARD_POINTS } from '../services/trainerService';
import { BottomNav, BackButton } from '../components/Navigation';

export default function TrainerDashboard({ isDemo = false }) {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [trainerData, setTrainerData] = useState(null);
    const [students, setStudents] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [currentTab, setCurrentTab] = useState('students');
    // students | leaderboard | challenges | benefits
    const [showCreateChallenge, setShowCreateChallenge] = useState(false);
    const [filter, setFilter] = useState(null); // null | risk | premium | active
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, [user]);

    const loadDashboardData = async () => {
        if (isDemo) {
            setTrainerData({
                displayName: 'Coach Demo 🔥',
                rewardLevel: 'gold',
                rewardPoints: 1250,
                studentCount: 8,
                studentReferrals: 3,
                shopDiscount: 0.10,
                coachCode: 'FITAI-DEMO-2024'
            });

            const mockStudents = [
                {
                    id: 'demo-1',
                    displayName: 'Juan Pérez',
                    goal: 'Hipertrofia',
                    isPremium: true,
                    stats: { workoutCount: 12, attendanceRate: 95, lastWorkoutDate: new Date(), daysSinceLastWorkout: 0, isAtRisk: false }
                },
                {
                    id: 'demo-2',
                    displayName: 'María García',
                    goal: 'Pérdida de Peso',
                    isPremium: false,
                    stats: { workoutCount: 2, attendanceRate: 20, lastWorkoutDate: new Date(Date.now() - 9 * 86400000), daysSinceLastWorkout: 9, isAtRisk: true }
                },
                {
                    id: 'demo-3',
                    displayName: 'Carlos Ruiz',
                    goal: 'Mantenimiento',
                    isPremium: true,
                    stats: { workoutCount: 15, attendanceRate: 100, lastWorkoutDate: new Date(Date.now() - 1 * 86400000), daysSinceLastWorkout: 1, isAtRisk: false }
                },
                {
                    id: 'demo-4',
                    displayName: 'Ana López',
                    goal: 'Definición',
                    isPremium: false,
                    stats: { workoutCount: 5, attendanceRate: 45, lastWorkoutDate: new Date(Date.now() - 4 * 86400000), daysSinceLastWorkout: 4, isAtRisk: false }
                },
                {
                    id: 'demo-5',
                    displayName: 'Roberto Gómez',
                    goal: 'Fuerza Máxima',
                    isPremium: true,
                    stats: { workoutCount: 0, attendanceRate: 0, lastWorkoutDate: null, daysSinceLastWorkout: null, isAtRisk: true }
                }
            ];
            setStudents(mockStudents);
            setLeaderboard(mockStudents.map(s => ({ id: s.id, displayName: s.displayName, workoutCount: s.stats.workoutCount })));
            setChallenges([]);
            setLoading(false);
            return;
        }

        if (!user) return;

        setLoading(true);
        try {
            // Get trainer profile
            const trainer = await trainerService.getTrainerById(user.uid);
            if (!trainer) {
                // Not a trainer, redirect to become one
                navigate('/become-trainer');
                return;
            }
            setTrainerData(trainer);

            // Sync stats in background to fix potential counter mismatches
            trainerService.syncTrainerStats(user.uid).then(res => {
                if (res.success) {
                    setTrainerData(prev => {
                        const newData = { ...prev };
                        let changed = false;

                        if (res.count !== prev.studentCount) {
                            newData.studentCount = res.count;
                            changed = true;
                        }
                        if (res.points !== undefined && res.points !== prev.rewardPoints) {
                            newData.rewardPoints = res.points;
                            changed = true;
                        }
                        if (res.level !== undefined && res.level !== prev.rewardLevel) {
                            newData.rewardLevel = res.level;
                            changed = true;
                        }

                        return changed ? newData : prev;
                    });
                }
            }).catch(err => console.warn('[TrainerDashboard] Sync failed:', err));

            // Get students with stats
            const studentsList = await trainerService.getMyStudentsWithStats(user.uid);
            console.log('[TrainerDashboard] Students loaded:', studentsList.length);
            setStudents(studentsList);

            // Get leaderboard
            const lb = await trainerService.getTeamLeaderboard(user.uid, 10);
            setLeaderboard(lb);

            // Get team challenges
            const teamChallenges = await trainerService.getTeamChallenges(user.uid);
            setChallenges(teamChallenges);
        } catch (error) {
            console.error('Error loading trainer dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        if (!trainerData?.coachCode) return;
        navigator.clipboard.writeText(trainerData.coachCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getLevelInfo = (level) => {
        const levelMap = {
            bronze: { name: 'Bronce', emoji: '🥉', color: 'amber' },
            silver: { name: 'Plata', emoji: '🥈', color: 'slate' },
            gold: { name: 'Oro', emoji: '🥇', color: 'yellow' },
            diamond: { name: 'Diamante', emoji: '💎', color: 'blue' }
        };
        return levelMap[level] || levelMap.bronze;
    };

    const getNextLevel = (currentPoints) => {
        if (currentPoints < 300) return { name: 'Plata', needed: 300 - currentPoints };
        if (currentPoints < 1000) return { name: 'Oro', needed: 1000 - currentPoints };
        if (currentPoints < 2500) return { name: 'Diamante', needed: 2500 - currentPoints };
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    const levelInfo = getLevelInfo(trainerData?.rewardLevel);
    const nextLevel = getNextLevel(trainerData?.rewardPoints || 0);
    const levelProgress = trainerData?.rewardPoints ?
        Math.min((trainerData.rewardPoints / (nextLevel ? (trainerData.rewardPoints + nextLevel.needed) : 2500)) * 100, 100) : 0;

    if (!trainerData) return null; // Fallback safety

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-40 md:pb-8">

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Top Bar */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <BackButton />
                        <div className="bg-brand-primary/10 p-2 rounded-xl border border-brand-primary/20">
                            <Users className="text-brand-primary" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-['Outfit'] font-black tracking-tight text-white leading-tight">
                                Panel de Coach
                            </h1>
                            <p className="text-slate-400 text-sm font-medium">
                                Hola, {trainerData.displayName} 🔥
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={loadDashboardData}
                        disabled={loading}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-slate-400 hover:text-white"
                    >
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-brand-primary/20 to-brand-violet/20 rounded-2xl p-4 md:p-6 border border-brand-primary/30 relative overflow-hidden group mb-6"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-primary/20 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-brand-primary-light font-black uppercase tracking-[0.2em] text-[10px]">
                                Tu Código de Coach
                            </span>
                            <Copy size={16} className="text-brand-primary-light opacity-50" />
                        </div>
                        <div className="flex items-center gap-4 mb-3">
                            <h2 className="text-4xl font-['Outfit'] font-black tracking-tighter text-white">
                                {trainerData.coachCode}
                            </h2>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(trainerData.coachCode);
                                    setCopySuccess(true);
                                    setTimeout(() => setCopySuccess(false), 2000);
                                }}
                                className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl transition-all border border-white/10"
                            >
                                {copySuccess ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-slate-300" />}
                            </button>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                            Comparte este código con tus alumnos para que se registren bajo tu gestión y desbloqueen beneficios exclusivos.
                        </p>
                    </div>
                </motion.div>

                {/* Overview Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <StatCard
                        icon={Users}
                        label="Alumnos"
                        value={trainerData.studentCount}
                        gradient="from-blue-500/20 to-blue-600/20"
                        iconColor="text-blue-400"
                        border="border-blue-500/30"
                    />
                    <StatCard
                        icon={Dumbbell}
                        label="Entrenos"
                        value={trainerData.stats?.workoutCount || trainerData.workoutCount || 0}
                        subLabel="equipo"
                        gradient="from-emerald-500/20 to-emerald-600/20"
                        iconColor="text-emerald-400"
                        border="border-emerald-500/30"
                    />
                    <StatCard
                        icon={Star}
                        label="Puntos"
                        value={trainerData.rewardPoints}
                        gradient="from-amber-500/20 to-amber-600/20"
                        iconColor="text-amber-400"
                        border="border-amber-500/30"
                    />
                    <StatCard
                        icon={Crown}
                        label="Premium"
                        value={trainerData.studentReferrals}
                        subLabel="referidos"
                        gradient="from-violet-500/20 to-violet-600/20"
                        iconColor="text-violet-400"
                        border="border-violet-500/30"
                    />
                </div>

                {/* Rewards Progress */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-white/5 relative overflow-hidden group mb-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[60px] rounded-full"></div>
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <Trophy className="text-amber-400" size={24} />
                            <h3 className="font-['Outfit'] font-black uppercase tracking-widest text-xs text-slate-400">
                                Tus Recompensas
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                            <Crown size={12} className="text-amber-400" />
                            <span className="text-amber-400 font-black text-[9px] uppercase tracking-wider">
                                Nivel {TRAINER_LEVELS[trainerData.rewardLevel]?.name || 'Base'}
                            </span>
                        </div>
                    </div>

                    <div className="relative mb-6 z-10">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                            <span>{trainerData.rewardPoints} pts</span>
                            <span>{TRAINER_LEVELS[trainerData.rewardLevel]?.nextLevelPoints} pts para {TRAINER_LEVELS[trainerData.rewardLevel]?.nextLevelName}</span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(trainerData.rewardPoints / TRAINER_LEVELS[trainerData.rewardLevel]?.nextLevelPoints) * 100}%` }}
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 relative"
                            >
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                            </motion.div>
                        </div>
                    </div>

                    {trainerData.shopDiscount > 0 && (
                        <div className="flex items-center gap-3 py-4 border-t border-white/5 mt-4 group/item relative z-10">
                            <div className="bg-emerald-500/10 p-2 rounded-lg">
                                <Star className="text-emerald-400" size={16} />
                            </div>
                            <p className="text-emerald-400 font-bold text-sm tracking-tight">
                                {trainerData.shopDiscount * 100}% de descuento activo en Tienda
                            </p>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden mb-6 shadow-xl shadow-black/40">
                    <div className="flex p-1 bg-slate-800/50 border-b border-white/5 overflow-x-auto no-scrollbar">
                        <TabButton active={currentTab === 'students'} onClick={() => setCurrentTab('students')} icon={Users} label="Alumnos" />
                        <TabButton active={currentTab === 'leaderboard'} onClick={() => setCurrentTab('leaderboard')} icon={Trophy} label="Ranking" />
                        <TabButton active={currentTab === 'challenges'} onClick={() => setCurrentTab('challenges')} icon={Flag} label="Retos" />
                        <TabButton active={currentTab === 'benefits'} onClick={() => setCurrentTab('benefits')} icon={Gift} label="Beneficios" />
                    </div>

                    <div className="p-6">
                        {currentTab === 'students' && (
                            <motion.div
                                key="students"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {students.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <UserPlus size={48} className="mx-auto mb-4 opacity-30" />
                                        <p>No tenés alumnos todavía</p>
                                        <p className="text-sm mt-2">Compartí tu código para que se registren</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Search and Filters */}
                                        <div className="flex flex-wrap gap-3 items-center">
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    placeholder="BUSCAR..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="bg-slate-900/50 text-white border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-[11px] font-black uppercase tracking-widest w-36 focus:w-48 transition-all focus:border-blue-500/50 outline-none placeholder:text-slate-600 shadow-inner"
                                                />
                                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                            </div>

                                            <div className="h-6 w-px bg-white/5 hidden md:block mx-1"></div>

                                            <div className="flex flex-wrap gap-2">
                                                <FilterButton
                                                    label="Todos"
                                                    count={students.length}
                                                    active={!filter}
                                                    color="blue"
                                                    onClick={() => setFilter(null)}
                                                />
                                                <FilterButton
                                                    label="En Riesgo"
                                                    count={students.filter(s => s.stats?.isAtRisk).length}
                                                    active={filter === 'risk'}
                                                    color="red"
                                                    onClick={() => setFilter('risk')}
                                                />
                                                <FilterButton
                                                    label="Premium"
                                                    count={students.filter(s => s.isPremium).length}
                                                    active={filter === 'premium'}
                                                    color="amber"
                                                    onClick={() => setFilter('premium')}
                                                />
                                                <FilterButton
                                                    label="Activos"
                                                    count={students.filter(s => s.stats?.workoutCount > 0).length}
                                                    active={filter === 'active'}
                                                    color="emerald"
                                                    onClick={() => setFilter('active')}
                                                />
                                            </div>
                                        </div>

                                        {/* Students List */}
                                        <div className="grid gap-4">
                                            {(() => {
                                                const filtered = students.filter(s => {
                                                    const matchesFilter = filter === 'risk' ? s.stats?.isAtRisk :
                                                        filter === 'premium' ? s.isPremium :
                                                            filter === 'active' ? s.stats?.workoutCount > 0 :
                                                                true;

                                                    const matchesSearch = !searchQuery ||
                                                        (s.displayName || s.name || '').toLowerCase().includes(searchQuery.toLowerCase());

                                                    return matchesFilter && matchesSearch;
                                                });

                                                if (filtered.length === 0 && searchQuery) {
                                                    return (
                                                        <div className="py-12 text-center text-slate-600 italic text-sm bg-white/[0.02] rounded-3xl border border-dashed border-white/5">
                                                            No se encontraron alumnos para "{searchQuery}"
                                                        </div>
                                                    );
                                                }

                                                return filtered.map((student, index) => (
                                                    <StudentCard
                                                        key={student.id}
                                                        student={student}
                                                        rank={index + 1}
                                                        onClick={() => navigate(isDemo ? `/trainer/student/demo` : `/trainer/student/${student.id}`)}
                                                    />
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {currentTab === 'leaderboard' && (
                            <motion.div
                                key="leaderboard"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-3"
                            >
                                {leaderboard.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <Trophy size={48} className="mx-auto mb-4 opacity-30" />
                                        <p>Ranking vacío</p>
                                        <p className="text-sm mt-2">Tus alumnos necesitan entrenar para aparecer</p>
                                    </div>
                                ) : (
                                    leaderboard.map((entry, index) => (
                                        <LeaderboardEntry
                                            key={entry.id}
                                            entry={entry}
                                            rank={index + 1}
                                        />
                                    ))
                                )}
                            </motion.div>
                        )}

                        {currentTab === 'challenges' && (
                            <motion.div
                                key="challenges"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                {/* Create Challenge Button */}
                                <button
                                    onClick={() => setShowCreateChallenge(true)}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl font-bold flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} />
                                    Crear Reto de Equipo
                                </button>

                                {/* Challenges List */}
                                {challenges.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <Flag size={48} className="mx-auto mb-4 opacity-30" />
                                        <p>No hay retos activos</p>
                                        <p className="text-sm mt-2">Creá un reto para motivar a tus alumnos</p>
                                    </div>
                                ) : (
                                    challenges.map((challenge) => (
                                        <ChallengeCard key={challenge.id} challenge={challenge} />
                                    ))
                                )}
                            </motion.div>
                        )}

                        {currentTab === 'benefits' && (
                            <motion.div
                                key="benefits"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                {/* Points Breakdown */}
                                <div>
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-2 mb-6"
                                    >
                                        <div className="bg-amber-400/10 p-2 rounded-lg">
                                            <Zap className="text-amber-400" size={18} />
                                        </div>
                                        <h3 className="text-lg font-black tracking-tight font-['Outfit'] uppercase">Cómo Ganar Puntos</h3>
                                    </motion.div>
                                    <div className="bg-slate-800/30 rounded-3xl border border-white/5 overflow-hidden">
                                        <PointInfoRow icon={UserPlus} label="Nuevo Alumno Registrado" points={REWARD_POINTS.STUDENT_REGISTERED} color="text-blue-400" />
                                        <Divider />
                                        <PointInfoRow icon={Target} label="Alumno Completa Onboarding" points={REWARD_POINTS.STUDENT_COMPLETED_ONBOARDING} color="text-indigo-400" />
                                        <Divider />
                                        <PointInfoRow icon={Dumbbell} label="Alumno Entrena 10 Veces" points={REWARD_POINTS.STUDENT_TRAINED_10_TIMES} color="text-emerald-400" />
                                        <Divider />
                                        <PointInfoRow icon={Crown} label="Alumno se vuelve Premium (Mes)" points={REWARD_POINTS.STUDENT_PREMIUM_MONTHLY} color="text-amber-400" isHighlight />
                                        <Divider />
                                        <PointInfoRow icon={Star} label="Alumno se vuelve Premium (Anual)" points={REWARD_POINTS.STUDENT_PREMIUM_ANNUAL} color="text-violet-400" isHighlight />
                                    </div>
                                </div>

                                {/* Levels Breakdown */}
                                <div>
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="flex items-center gap-2 mb-6"
                                    >
                                        <div className="bg-brand-primary/10 p-2 rounded-lg">
                                            <Trophy className="text-brand-primary" size={18} />
                                        </div>
                                        <h3 className="text-lg font-black tracking-tight font-['Outfit'] uppercase">Niveles y Beneficios</h3>
                                    </motion.div>
                                    <div className="space-y-4">
                                        {Object.entries(TRAINER_LEVELS).map(([key, level], index) => {
                                            const details = trainerService.getLevelDetails(key);
                                            const isCurrent = trainerData?.rewardLevel === key;
                                            return (
                                                <LevelBenefitCard
                                                    key={key}
                                                    level={key}
                                                    details={details}
                                                    isCurrent={isCurrent}
                                                    index={index}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Create Challenge Modal */}
                <AnimatePresence>
                    {showCreateChallenge && (
                        <CreateChallengeModal
                            onClose={() => setShowCreateChallenge(false)}
                            onCreate={async (challengeData) => {
                                try {
                                    await trainerService.createTeamChallenge(user.uid, challengeData);
                                    setShowCreateChallenge(false);
                                    loadDashboardData();
                                } catch (error) {
                                    alert('Error: ' + error.message);
                                }
                            }}
                        />
                    )}
                </AnimatePresence>
            </div>

            <BottomNav />
        </div>
    );
}

// Individual Stat Card Component
function StatCard({ icon: Icon, label, value, subLabel, gradient, iconColor, border }) {
    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className={`bg-slate-900/50 backdrop-blur-xl rounded-2xl p-4 border ${border || 'border-white/5'} relative overflow-hidden group shadow-lg shadow-black/20`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className="relative z-10">
                <div className={`p-3 rounded-2xl bg-slate-800/50 w-fit mb-4 border border-white/5 ${iconColor}`}>
                    <Icon size={20} />
                </div>
                <div className="text-2xl font-['Outfit'] font-black text-white mb-1 tracking-tight">
                    {value}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    {label} {subLabel && <span className="text-[8px] opacity-50">({subLabel})</span>}
                </div>
            </div>
        </motion.div>
    );
}

const getGoalLabel = (goal) => {
    const goalMap = {
        'fat': 'Pérdida de Grasa',
        'muscle': 'Ganancia Muscular',
        'strength': 'Fuerza',
        'performance': 'Rendimiento',
        'balanced': 'Equilibrio / Salud'
    };

    // Si es un array (como en el onboarding), tomamos el primero
    const target = Array.isArray(goal) ? goal[0] : goal;
    return goalMap[target] || target || 'Sin objetivo';
};

// Student Card Component (V2)
function StudentCard({ student, rank, onClick }) {
    const initial = (student.displayName || student.name || 'U')[0].toUpperCase();
    const stats = student.stats || {};
    const goalLabel = getGoalLabel(student.primaryGoal || student.goal);

    return (
        <motion.button
            whileHover={{ y: -2 }}
            onClick={onClick}
            className={`w-full bg-slate-900 rounded-2xl p-5 border flex flex-col gap-4 text-left transition-all ${stats.isAtRisk ? 'border-red-500/30' : 'border-white/5 hover:border-blue-500/30'
                }`}
        >
            <div className="flex items-center gap-4">
                <div className="relative">
                    {(student.photoURL || student.avatarUrl) ? (
                        <img
                            src={student.photoURL || student.avatarUrl}
                            alt={student.displayName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-slate-800"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xl font-black">
                            {initial}
                        </div>
                    )}
                    {student.isPremium && (
                        <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-1 rounded-full border-2 border-slate-950">
                            <Crown size={12} fill="currentColor" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="font-black text-lg truncate flex items-center gap-2">
                        {student.displayName || student.name || 'Usuario'}
                        {stats.isAtRisk && (
                            <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                                En Riesgo
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                        {goalLabel}
                    </div>
                </div>
                <ChevronRight size={20} className="text-slate-600" />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Entrenos (30d)</div>
                    <div className="text-lg font-black text-blue-400">{stats.workoutCount || 0}</div>
                </div>
                <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Asistencia</div>
                    <div className="text-lg font-black text-green-400">{stats.attendanceRate || 0}%</div>
                </div>
                <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Última Vez</div>
                    <div className="text-lg font-black text-white/80">
                        {stats.daysSinceLastWorkout === null ? '--' :
                            stats.daysSinceLastWorkout === 0 ? 'Hoy' :
                                stats.daysSinceLastWorkout === 1 ? 'Ayer' :
                                    `${stats.daysSinceLastWorkout}d`}
                    </div>
                </div>
            </div>

            {/* Compliance Bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Cumplimiento Semanal</span>
                    <span>{stats.attendanceRate}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.attendanceRate}%` }}
                        className={`h-full bg-gradient-to-r ${stats.attendanceRate > 70 ? 'from-green-500 to-emerald-400' :
                            stats.attendanceRate > 40 ? 'from-yellow-500 to-orange-400' :
                                'from-red-500 to-rose-400'
                            }`}
                    />
                </div>
            </div>
        </motion.button >
    );
}

// Filter Button Component
function FilterButton({ label, count, active, onClick, color }) {
    const colorClasses = {
        blue: active ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900/50 text-slate-400 border-white/5 hover:border-blue-500/30',
        red: active ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-900/50 text-slate-400 border-white/5 hover:border-red-500/30',
        amber: active ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-900/50 text-slate-400 border-white/5 hover:border-amber-500/30',
        emerald: active ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-900/50 text-slate-400 border-white/5 hover:border-emerald-500/30'
    };

    return (
        <button
            onClick={onClick}
            className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${colorClasses[color]}`}
        >
            {label}
            <span className={`px-2 py-0.5 rounded-full text-[9px] ${active ? 'bg-white/20' : 'bg-slate-800 text-slate-500'}`}>
                {count}
            </span>
        </button>
    );
}

// Tab Button Component (New)
function TabButton({ icon: Icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <Icon size={16} />
            {label}
        </button>
    );
}

// Leaderboard Entry Component
function LeaderboardEntry({ entry, rank }) {
    const rankColors = {
        1: 'from-yellow-400 to-amber-500',
        2: 'from-slate-300 to-slate-400',
        3: 'from-amber-600 to-orange-700',
    };
    const initial = (entry.displayName || 'U')[0].toUpperCase();

    return (
        <div className="bg-slate-900 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${rank <= 3
                ? `bg-gradient-to-br ${rankColors[rank]} text-slate-900`
                : 'bg-slate-800 text-slate-400'
                }`}>
                {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
            </div>
            {entry.photoURL || entry.avatarUrl ? (
                <img
                    src={entry.photoURL || entry.avatarUrl}
                    alt={entry.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                />
            ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center font-bold">
                    {initial}
                </div>
            )}
            <div className="flex-1">
                <div className="font-bold">{entry.displayName}</div>
            </div>
            <div className="text-right">
                <div className="font-black text-blue-400">{entry.workoutCount}</div>
                <div className="text-xs text-slate-500">entrenos</div>
            </div>
        </div>
    );
}

// Challenge Card Component
function ChallengeCard({ challenge }) {
    const typeLabels = {
        total_workouts: '💪 Entrenos',
        streak: '🔥 Racha',
        custom: '🎯 Personalizado',
    };

    const isExpired = challenge.endDate && new Date(challenge.endDate.toDate?.() || challenge.endDate) < new Date();

    return (
        <div className={`bg-slate-900 rounded-2xl p-5 border ${isExpired ? 'border-slate-700 opacity-60' : 'border-white/10'}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Flag className="text-blue-400" size={18} />
                    <span className="font-bold">{challenge.title}</span>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${isExpired
                    ? 'bg-slate-700 text-slate-400'
                    : 'bg-green-500/20 text-green-400'
                    }`}>
                    {isExpired ? 'Finalizado' : 'Activo'}
                </span>
            </div>

            {challenge.description && (
                <p className="text-sm text-slate-400 mb-3">{challenge.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{typeLabels[challenge.type] || challenge.type}</span>
                <span>Meta: {challenge.target}</span>
                <span>{challenge.leaderboard?.length || 0} participantes</span>
            </div>
        </div>
    );
}

// Create Challenge Modal
function CreateChallengeModal({ onClose, onCreate }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'total_workouts',
        target: 10,
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!formData.title.trim()) return;

        setIsLoading(true);
        try {
            await onCreate(formData);
        } finally {
            setIsLoading(false);
        }
    };

    const challengeTypes = [
        { id: 'total_workouts', label: '💪 Entrenos Totales', desc: 'Quién completa más entrenos' },
        { id: 'streak', label: '🔥 Racha más larga', desc: 'Días consecutivos entrenando' },
        { id: 'custom', label: '🎯 Personalizado', desc: 'Define tu propia meta' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/10 max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                    <Flag className="text-blue-400" />
                    Nuevo Reto de Equipo
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Nombre del Reto</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ej: Reto 21 días"
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Descripción (opcional)</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="¿De qué trata el reto?"
                            rows={2}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white resize-none"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Tipo de Reto</label>
                        <div className="space-y-2">
                            {challengeTypes.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setFormData({ ...formData, type: type.id })}
                                    className={`w-full p-3 rounded-xl text-left border transition-all ${formData.type === type.id
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="font-bold text-sm">{type.label}</div>
                                    <div className="text-xs text-slate-500">{type.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Meta</label>
                        <input
                            type="number"
                            value={formData.target}
                            onChange={e => setFormData({ ...formData, target: parseInt(e.target.value) || 1 })}
                            min={1}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-slate-800 rounded-xl font-bold"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!formData.title.trim() || isLoading}
                        className="flex-1 py-3 bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                        Crear Reto
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Helper components for Benefits tab
function PointInfoRow({ icon: Icon, label, points, color, isHighlight }) {
    return (
        <div className={`flex items-center justify-between p-5 ${isHighlight ? 'bg-white/5' : ''}`}>
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl bg-slate-800/80 border border-white/5 ${color}`}>
                    <Icon size={18} />
                </div>
                <span className="text-sm font-bold text-slate-200">{label}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-white/10 shadow-inner">
                <Star size={12} className="text-amber-400" fill="currentColor" />
                <span className="text-sm font-black text-white">+{points}</span>
            </div>
        </div>
    );
}

function Divider() {
    return <div className="h-[1px] bg-white/[0.03] mx-5" />;
}

function LevelBenefitCard({ level, details, isCurrent, index }) {
    const colorMap = {
        bronze: 'from-amber-700/20 to-amber-900/20 border-amber-500/30 text-amber-500',
        silver: 'from-slate-400/10 to-slate-600/10 border-slate-400/30 text-slate-400',
        gold: 'from-yellow-500/20 to-yellow-700/20 border-yellow-500/30 text-yellow-500',
        diamond: 'from-blue-500/20 to-blue-700/20 border-blue-400/30 text-blue-400',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (index * 0.1) }}
            className={`rounded-2xl p-5 border relative overflow-hidden transition-all ${isCurrent ? 'ring-2 ring-brand-primary ring-offset-4 ring-offset-slate-950 shadow-[0_0_20px_rgba(236,72,153,0.3)]' : ''
                } ${colorMap[level] || colorMap.bronze}`}
        >
            {isCurrent && (
                <div className="absolute top-0 right-0 bg-brand-primary text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest flex items-center gap-1 shadow-lg">
                    <Check size={10} /> Tu Nivel Actual
                </div>
            )}

            <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl">{details.emoji}</div>
                <div>
                    <h4 className="font-black text-xl font-['Outfit'] uppercase">{details.name}</h4>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                        {details.min === 0 ? 'Punto de Inicio' : `${details.min} PTS`}
                        {details.max !== Infinity ? ` — ${details.max} PTS` : ' +'}
                    </p>
                </div>
            </div>

            <div className="grid gap-2">
                <BenefitItem
                    icon={Star}
                    label={details.discount > 0 ? `${details.discount * 100}% Descuento en Tienda` : 'Sin descuento especial'}
                    active={details.discount > 0}
                />
                <BenefitItem
                    icon={ShieldCheck}
                    label="Certificado de Coach Elite"
                    active={level !== 'bronze'}
                />
                <BenefitItem
                    icon={Flame}
                    label="Referidos Automáticos de FITAI"
                    active={level === 'diamond'}
                />
            </div>
        </motion.div>
    );
}

function BenefitItem({ icon: Icon, label, active }) {
    return (
        <div className={`flex items-center gap-2 text-xs font-medium ${active ? 'text-white' : 'text-slate-500 italic'}`}>
            <Icon size={14} className={active ? 'text-brand-cyan' : 'opacity-20'} />
            <span>{label}</span>
        </div>
    );
}

