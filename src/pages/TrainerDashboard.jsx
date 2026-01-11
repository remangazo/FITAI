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
    Target, Flame, BarChart3, Settings, RefreshCw, Plus, Calendar, Flag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { trainerService, TRAINER_LEVELS } from '../services/trainerService';
import { BottomNav, BackButton } from '../components/Navigation';

export default function TrainerDashboard() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [trainerData, setTrainerData] = useState(null);
    const [students, setStudents] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('students'); // students | leaderboard | challenges
    const [showCreateChallenge, setShowCreateChallenge] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, [user]);

    const loadDashboardData = async () => {
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

            // Get students
            const studentsList = await trainerService.getMyStudents(user.uid);
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
            bronze: { name: 'Bronce', emoji: 'ðŸ¥‰', color: 'amber' },
            silver: { name: 'Plata', emoji: 'ðŸ¥ˆ', color: 'slate' },
            gold: { name: 'Oro', emoji: 'ðŸ¥‡', color: 'yellow' },
            diamond: { name: 'Diamante', emoji: 'ðŸ’Ž', color: 'cyan' },
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

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24 md:pb-8">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-lg border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BackButton />
                            <div>
                                <h1 className="text-xl font-black">Dashboard Trainer</h1>
                                <p className="text-xs text-slate-400">
                                    Hola, {trainerData?.displayName || 'Trainer'} {levelInfo.emoji}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={loadDashboardData}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Coach Code Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl p-5 border border-blue-500/30"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400 mb-1">Tu CÃ³digo de Coach</p>
                            <p className="text-2xl font-mono font-black text-blue-400 tracking-wider">
                                {trainerData?.coachCode || 'FITAI-XXXX-XXXX'}
                            </p>
                        </div>
                        <button
                            onClick={copyCode}
                            className="p-3 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                        CompartÃ­ este cÃ³digo con tus alumnos para que se registren bajo tu coaching
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                        icon={Users}
                        label="Alumnos"
                        value={trainerData?.studentCount || 0}
                        color="blue"
                    />
                    <StatCard
                        icon={Dumbbell}
                        label="Entrenos (equipo)"
                        value={leaderboard.reduce((sum, s) => sum + s.workoutCount, 0)}
                        color="green"
                    />
                    <StatCard
                        icon={Star}
                        label="Puntos"
                        value={trainerData?.rewardPoints || 0}
                        color="yellow"
                    />
                    <StatCard
                        icon={Crown}
                        label="Premium refs"
                        value={trainerData?.studentReferrals || 0}
                        color="purple"
                    />
                </div>

                {/* Rewards Progress */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Trophy className="text-yellow-400" size={20} />
                            <span className="font-bold">Tus Recompensas</span>
                        </div>
                        <span className={`text-sm font-bold px-3 py-1 rounded-full bg-${levelInfo.color}-500/20 text-${levelInfo.color}-400`}>
                            {levelInfo.emoji} Nivel {levelInfo.name}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>{trainerData?.rewardPoints || 0} pts</span>
                            {nextLevel && <span>{nextLevel.needed} pts para {nextLevel.name}</span>}
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${levelProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Current Benefit */}
                    <div className="text-sm text-slate-400">
                        {trainerData?.shopDiscount > 0 ? (
                            <span className="text-green-400">âœ… {Math.round(trainerData.shopDiscount * 100)}% descuento en Tienda</span>
                        ) : (
                            <span>ðŸŽ¯ SumÃ¡ puntos para desbloquear descuentos</span>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-slate-900 p-1 rounded-xl">
                    {[
                        { id: 'students', label: 'Alumnos', icon: Users },
                        { id: 'leaderboard', label: 'Ranking', icon: Trophy },
                        { id: 'challenges', label: 'Retos', icon: Flag },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Students List */}
                <AnimatePresence mode="wait">
                    {activeTab === 'students' && (
                        <motion.div
                            key="students"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            {students.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <UserPlus size={48} className="mx-auto mb-4 opacity-30" />
                                    <p>No tenÃ©s alumnos todavÃ­a</p>
                                    <p className="text-sm mt-2">CompartÃ­ tu cÃ³digo para que se registren</p>
                                </div>
                            ) : (
                                students.map((student, index) => (
                                    <StudentCard
                                        key={student.id}
                                        student={student}
                                        rank={index + 1}
                                        onClick={() => navigate(`/trainer/student/${student.id}`)}
                                    />
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'leaderboard' && (
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
                                    <p>Ranking vacÃ­o</p>
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

                    {activeTab === 'challenges' && (
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
                                    <p className="text-sm mt-2">CreÃ¡ un reto para motivar a tus alumnos</p>
                                </div>
                            ) : (
                                challenges.map((challenge) => (
                                    <ChallengeCard key={challenge.id} challenge={challenge} />
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

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

// Stat Card Component
function StatCard({ icon: Icon, label, value, color }) {
    const colorClasses = {
        blue: 'from-blue-500/20 to-blue-600/10 text-blue-400',
        green: 'from-green-500/20 to-green-600/10 text-green-400',
        yellow: 'from-yellow-500/20 to-yellow-600/10 text-yellow-400',
        purple: 'from-purple-500/20 to-purple-600/10 text-purple-400',
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-4 border border-white/5`}>
            <Icon size={20} className="mb-2" />
            <div className="text-2xl font-black">{value}</div>
            <div className="text-xs text-slate-400">{label}</div>
        </div>
    );
}

// Student Card Component
function StudentCard({ student, rank, onClick }) {
    const initial = (student.displayName || student.name || 'U')[0].toUpperCase();

    return (
        <motion.button
            whileHover={{ x: 4 }}
            onClick={onClick}
            className="w-full bg-slate-900 rounded-2xl p-4 border border-white/5 flex items-center gap-4 text-left hover:border-blue-500/30 transition-colors"
        >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-lg font-black">
                {initial}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{student.displayName || student.name || 'Usuario'}</div>
                <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span>{student.goal || 'Sin objetivo'}</span>
                    {student.isPremium && (
                        <span className="text-amber-400 flex items-center gap-1">
                            <Crown size={12} /> Premium
                        </span>
                    )}
                </div>
            </div>
            <ChevronRight size={18} className="text-slate-500" />
        </motion.button>
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
                {rank <= 3 ? ['ðŸ¥‡', 'ðŸ¥ˆ', 'ðŸ¥‰'][rank - 1] : rank}
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center font-bold">
                {initial}
            </div>
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
        total_workouts: 'ðŸ‹ï¸ Entrenos',
        streak: 'ðŸ”¥ Racha',
        custom: 'ðŸŽ¯ Personalizado',
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
        { id: 'total_workouts', label: 'ðŸ‹ï¸ Entrenos Totales', desc: 'QuiÃ©n completa mÃ¡s entrenos' },
        { id: 'streak', label: 'ðŸ”¥ Racha mÃ¡s larga', desc: 'DÃ­as consecutivos entrenando' },
        { id: 'custom', label: 'ðŸŽ¯ Personalizado', desc: 'Define tu propia meta' },
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
                            placeholder="Ej: Reto 21 dÃ­as"
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">DescripciÃ³n (opcional)</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Â¿De quÃ© trata el reto?"
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

