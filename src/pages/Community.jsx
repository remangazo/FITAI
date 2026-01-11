import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, Users, Medal, Target, Clock, CheckCircle, Camera, Upload,
    Dumbbell, Flame, Star, Crown, Award, ChevronRight, X, Check,
    Calendar, TrendingUp, MessageCircle, Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { BottomNav, BackButton } from '../components/Navigation';

// Mock challenges data with verification requirements
const CHALLENGES = [
    {
        id: 1,
        title: '100 Flexiones Diarias',
        description: 'Completa 100 flexiones cada día durante 7 días seguidos.',
        xpReward: 500,
        duration: '7 días',
        difficulty: 'Medio',
        category: 'strength',
        icon: '💪',
        participants: 234,
        verificationType: 'video', // video, photo, workout_log, auto
        requirements: 'Sube un video de tu sesión de flexiones diaria.',
        progress: { current: 3, total: 7 },
        milestones: [1, 3, 5, 7]
    },
    {
        id: 2,
        title: 'Maratón de Sentadillas',
        description: '1000 sentadillas en una semana. Demuestra tu resistencia.',
        xpReward: 750,
        duration: '7 días',
        difficulty: 'Difícil',
        category: 'endurance',
        icon: '🦵',
        participants: 156,
        verificationType: 'workout_log',
        requirements: 'Registra tus sentadillas en la app después de cada sesión.',
        progress: { current: 450, total: 1000 },
        milestones: [250, 500, 750, 1000]
    },
    {
        id: 3,
        title: 'PR de Peso Muerto',
        description: 'Supera tu récord personal en peso muerto.',
        xpReward: 1000,
        duration: '30 días',
        difficulty: 'Épico',
        category: 'strength',
        icon: '🏋️',
        participants: 89,
        verificationType: 'video',
        requirements: 'Sube un video de tu nuevo PR con el peso visible.',
        progress: null, // Single completion challenge
        currentPR: 120,
        targetPR: 125
    },
    {
        id: 4,
        title: 'Consistencia Ninja',
        description: 'Entrena 5 días a la semana durante 4 semanas consecutivas.',
        xpReward: 2000,
        duration: '28 días',
        difficulty: 'Legendario',
        category: 'consistency',
        icon: '🥷',
        participants: 45,
        verificationType: 'auto', // Auto-verified by app
        requirements: 'La app registrará automáticamente tus entrenamientos.',
        progress: { current: 12, total: 20 },
        milestones: [5, 10, 15, 20]
    }
];

// Mock leaderboard data (This would ideally be fetched from a global leaderboard collection)
const MOCK_LEADERBOARD = [
    { rank: 1, name: 'Carlos M.', xp: 15240, level: 23, avatar: '🦁', streak: 45, isCurrentUser: false },
    { rank: 2, name: 'María G.', xp: 14890, level: 22, avatar: '🦊', streak: 38, isCurrentUser: false },
    { rank: 3, name: 'Juan P.', xp: 13200, level: 21, avatar: '🐺', streak: 32, isCurrentUser: false },
    { rank: 4, name: 'Ana R.', xp: 12100, level: 20, avatar: '🦅', streak: 28, isCurrentUser: false },
    { rank: 6, name: 'Pedro L.', xp: 10800, level: 18, avatar: '🐻', streak: 22, isCurrentUser: false },
    { rank: 7, name: 'Laura S.', xp: 9500, level: 17, avatar: '🦋', streak: 19, isCurrentUser: false },
];

export default function Community() {
    const { user, profile, updateProfile } = useAuth();
    const { showToast } = useNotifications?.() || { showToast: () => { } };
    const [activeTab, setActiveTab] = useState('challenges');
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [uploadedProof, setUploadedProof] = useState(null);
    const [myChallenges, setMyChallenges] = useState([]);

    // Real user stats
    const userXP = profile?.totalXP || 0;
    const userLevel = profile?.level || Math.floor(userXP / 500) + 1;
    const userStreak = profile?.currentStreak || 0;

    // Construct real leaderboard with current user
    const leaderboard = [
        ...MOCK_LEADERBOARD,
        {
            rank: 5, // Simplified rank
            name: profile?.name || user?.displayName || 'Tú',
            xp: userXP,
            level: userLevel,
            avatar: '🔥',
            streak: userStreak,
            isCurrentUser: true
        }
    ].sort((a, b) => b.xp - a.xp).map((item, idx) => ({ ...item, rank: idx + 1 }));

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('fitai_my_challenges') || '[]');
        setMyChallenges(saved);
    }, []);

    const joinChallenge = (challenge) => {
        if (myChallenges.find(c => c.id === challenge.id)) {
            showToast({ type: 'info', message: 'Ya estás participando en este desafío' });
            return;
        }
        const newChallenge = {
            ...challenge,
            joinedAt: new Date().toISOString(),
            submissions: [],
            status: 'active'
        };
        const updated = [...myChallenges, newChallenge];
        setMyChallenges(updated);
        localStorage.setItem('fitai_my_challenges', JSON.stringify(updated));
        showToast({ type: 'success', title: '¡Unido!', message: `Te uniste a "${challenge.title}"` });
    };

    const submitProof = async (challengeId, proofLink = null) => {
        setIsVerifying(true);
        // Simulate verification process
        await new Promise(resolve => setTimeout(resolve, 2000));

        const proofData = proofLink ? { type: 'link', url: proofLink } : uploadedProof;

        const updated = myChallenges.map(c => {
            if (c.id === challengeId) {
                return {
                    ...c,
                    submissions: [...(c.submissions || []), {
                        date: new Date().toISOString(),
                        proof: proofData,
                        verified: true
                    }]
                };
            }
            return c;
        });

        setMyChallenges(updated);
        localStorage.setItem('fitai_my_challenges', JSON.stringify(updated));
        showToast({ type: 'achievement', title: '¡Verificado!', message: 'Tu progreso ha sido registrado' });
        setIsVerifying(false);
        setSelectedChallenge(null);
        setUploadedProof(null);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24 md:pb-8">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-4 mb-6">
                        <BackButton to="/dashboard" />
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Comunidad</h1>
                            <p className="text-slate-400 text-sm">Compite, supera desafíos y gana XP</p>
                        </div>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 rounded-2xl">
                            <Trophy size={18} />
                            <span className="font-black">{userXP.toLocaleString()} XP</span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'challenges', label: 'Desafíos', icon: <Target size={16} /> },
                            { id: 'my-challenges', label: 'Mis Desafíos', icon: <CheckCircle size={16} /> },
                            { id: 'leaderboard', label: 'Ranking', icon: <Crown size={16} /> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-amber-400 border-amber-400'
                                    : 'text-slate-500 border-transparent hover:text-slate-300'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                <AnimatePresence mode="wait">
                    {/* Challenges Tab */}
                    {activeTab === 'challenges' && (
                        <motion.div
                            key="challenges"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Challenge Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {CHALLENGES.map(challenge => (
                                    <ChallengeCard
                                        key={challenge.id}
                                        challenge={challenge}
                                        onJoin={() => joinChallenge(challenge)}
                                        isJoined={myChallenges.some(c => c.id === challenge.id)}
                                        onView={() => setSelectedChallenge(challenge)}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* My Challenges Tab */}
                    {activeTab === 'my-challenges' && (
                        <motion.div
                            key="my-challenges"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {myChallenges.length === 0 ? (
                                <div className="text-center py-20 glass rounded-3xl border border-white/5">
                                    <Target className="mx-auto text-slate-700 mb-4" size={48} />
                                    <h3 className="text-xl font-bold mb-2">Sin desafíos activos</h3>
                                    <p className="text-slate-400 mb-6">Únete a un desafío para empezar a ganar XP</p>
                                    <button
                                        onClick={() => setActiveTab('challenges')}
                                        className="bg-amber-600 hover:bg-amber-500 px-6 py-3 rounded-2xl font-bold"
                                    >
                                        Ver Desafíos
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {myChallenges.map(challenge => (
                                        <ActiveChallengeCard
                                            key={challenge.id}
                                            challenge={challenge}
                                            onVerify={() => setSelectedChallenge(challenge)}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Leaderboard Tab */}
                    {activeTab === 'leaderboard' && (
                        <motion.div
                            key="leaderboard"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Top 3 Podium */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="order-1">
                                    <PodiumCard user={leaderboard[1]} position={2} />
                                </div>
                                <div className="order-0 -mt-4">
                                    <PodiumCard user={leaderboard[0]} position={1} />
                                </div>
                                <div className="order-2">
                                    <PodiumCard user={leaderboard[2]} position={3} />
                                </div>
                            </div>

                            {/* Full Ranking */}
                            <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                                <div className="p-4 border-b border-white/5">
                                    <h3 className="font-bold">Ranking Global</h3>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {leaderboard.map(u => (
                                        <LeaderboardRow key={u.rank} user={u} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Challenge Detail Modal */}
            <AnimatePresence>
                {selectedChallenge && (
                    <ChallengeModal
                        challenge={selectedChallenge}
                        onClose={() => {
                            setSelectedChallenge(null);
                            setUploadedProof(null);
                        }}
                        onSubmitProof={() => submitProof(selectedChallenge.id)}
                        uploadedProof={uploadedProof}
                        setUploadedProof={setUploadedProof}
                        isVerifying={isVerifying}
                        isJoined={myChallenges.some(c => c.id === selectedChallenge.id)}
                        onJoin={() => joinChallenge(selectedChallenge)}
                    />
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
}

function ChallengeCard({ challenge, onJoin, isJoined, onView }) {
    const difficultyColors = {
        'Fácil': 'bg-green-500/20 text-green-400',
        'Medio': 'bg-yellow-500/20 text-yellow-400',
        'Difícil': 'bg-orange-500/20 text-orange-400',
        'Épico': 'bg-red-500/20 text-red-400',
        'Legendario': 'bg-purple-500/20 text-purple-400',
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="glass p-6 rounded-3xl border border-white/5 hover:border-amber-500/20 transition-all"
        >
            <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{challenge.icon}</span>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${difficultyColors[challenge.difficulty]}`}>
                        {challenge.difficulty}
                    </span>
                    <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Trophy size={10} /> {challenge.xpReward} XP
                    </span>
                </div>
            </div>

            <h3 className="font-bold text-lg mb-2">{challenge.title}</h3>
            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{challenge.description}</p>

            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1"><Clock size={12} /> {challenge.duration}</span>
                <span className="flex items-center gap-1"><Users size={12} /> {challenge.participants}</span>
                <span className="flex items-center gap-1">
                    {challenge.verificationType === 'video' && <><Play size={12} /> Video</>}
                    {challenge.verificationType === 'photo' && <><Camera size={12} /> Foto</>}
                    {challenge.verificationType === 'workout_log' && <><Dumbbell size={12} /> Registro</>}
                    {challenge.verificationType === 'auto' && <><Check size={12} /> Auto</>}
                </span>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onView}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-sm transition-colors"
                >
                    Ver Detalles
                </button>
                <button
                    onClick={onJoin}
                    disabled={isJoined}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${isJoined
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-amber-600 hover:bg-amber-500'
                        }`}
                >
                    {isJoined ? '✓ Unido' : 'Unirme'}
                </button>
            </div>
        </motion.div>
    );
}

function ActiveChallengeCard({ challenge, onVerify }) {
    const progress = challenge.progress
        ? Math.round((challenge.progress.current / challenge.progress.total) * 100)
        : 0;
    const submissions = challenge.submissions?.length || 0;

    return (
        <div className="glass p-6 rounded-3xl border border-white/5">
            <div className="flex items-start gap-4">
                <span className="text-4xl">{challenge.icon}</span>
                <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{challenge.title}</h3>
                    <p className="text-slate-400 text-sm mb-4">{challenge.requirements}</p>

                    {/* Progress bar */}
                    {challenge.progress && (
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Progreso</span>
                                <span className="font-bold">{challenge.progress.current} / {challenge.progress.total}</span>
                            </div>
                            <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <CheckCircle size={12} className="text-green-400" /> {submissions} verificaciones
                        </span>
                        <span className="flex items-center gap-1">
                            <Trophy size={12} className="text-amber-400" /> {challenge.xpReward} XP
                        </span>
                    </div>
                </div>
                <button
                    onClick={onVerify}
                    className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                >
                    <Upload size={14} /> Verificar
                </button>
            </div>
        </div>
    );
}

function ChallengeModal({ challenge, onClose, onSubmitProof, uploadedProof, setUploadedProof, isVerifying, isJoined, onJoin }) {
    const [proofLink, setProofLink] = useState('');

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedProof({
                name: file.name,
                type: file.type,
                preview: URL.createObjectURL(file)
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900 border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden relative z-10 max-h-[90vh] overflow-y-auto"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-slate-800 rounded-full z-20"
                >
                    <X size={20} />
                </button>

                <div className="p-8 space-y-6">
                    <div className="text-center">
                        <span className="text-6xl block mb-4">{challenge.icon}</span>
                        <h2 className="text-2xl font-black mb-2">{challenge.title}</h2>
                        <p className="text-slate-400">{challenge.description}</p>
                    </div>

                    {/* Verification Section */}
                    {isJoined && (
                        <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Camera className="text-blue-400" size={18} />
                                Verificar Progreso
                            </h3>
                            <p className="text-sm text-slate-400 mb-4">{challenge.requirements}</p>

                            {/* Upload area */}
                            <label className="block">
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <div className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${uploadedProof
                                    ? 'border-green-500 bg-green-500/10'
                                    : 'border-white/10 hover:border-white/30'
                                    }`}>
                                    {uploadedProof ? (
                                        <div className="space-y-2">
                                            {uploadedProof.type.startsWith('image') && (
                                                <img
                                                    src={uploadedProof.preview}
                                                    alt="Preview"
                                                    className="w-32 h-32 object-cover rounded-xl mx-auto"
                                                />
                                            )}
                                            <p className="text-green-400 font-bold">✓ {uploadedProof.name}</p>
                                            <p className="text-xs text-slate-500">Click para cambiar</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="mx-auto text-slate-600 mb-2" size={32} />
                                            <p className="text-slate-400">Sube foto o video como prueba</p>
                                            <p className="text-xs text-slate-600">Máx. 50MB</p>
                                        </>
                                    )}
                                </div>
                            </label>

                            <div className="flex items-center gap-3 my-4">
                                <div className="h-px bg-white/10 flex-1" />
                                <span className="text-[10px] text-slate-500 font-bold uppercase">O</span>
                                <div className="h-px bg-white/10 flex-1" />
                            </div>

                            <div className="bg-slate-900 border border-white/10 rounded-xl p-3 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Play size={14} className="text-blue-400" />
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Link de Video / Prueba</span>
                                </div>
                                <input
                                    type="url"
                                    value={proofLink}
                                    onChange={(e) => setProofLink(e.target.value)}
                                    placeholder="https://youtube.com/..."
                                    className="w-full bg-transparent border-none text-sm placeholder:text-slate-600 focus:outline-none"
                                />
                            </div>

                            {(uploadedProof || (proofLink && proofLink.length > 5)) && (
                                <button
                                    onClick={() => onSubmitProof(proofLink)}
                                    disabled={isVerifying}
                                    className="w-full mt-4 bg-green-600 hover:bg-green-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isVerifying ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                            <CheckCircle size={18} />
                                        </motion.div>
                                    ) : (
                                        <><CheckCircle size={18} /> Enviar Verificación</>
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {!isJoined && (
                        <button
                            onClick={() => { onJoin(); }}
                            className="w-full bg-amber-600 hover:bg-amber-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                            <Trophy size={18} /> Unirme al Desafío
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function PodiumCard({ user, position }) {
    const heights = { 1: 'h-32', 2: 'h-24', 3: 'h-20' };
    const colors = {
        1: 'from-amber-400 to-yellow-500',
        2: 'from-slate-300 to-slate-400',
        3: 'from-orange-400 to-amber-600'
    };
    const icons = { 1: '🥇', 2: '🥈', 3: '🥉' };

    return (
        <div className="text-center">
            <div className="text-4xl mb-2">{user.avatar}</div>
            <div className="font-bold text-sm truncate">{user.name}</div>
            <div className="text-xs text-slate-500 mb-2">{user.xp.toLocaleString()} XP</div>
            <div className={`${heights[position]} bg-gradient-to-t ${colors[position]} rounded-t-2xl flex items-start justify-center pt-2`}>
                <span className="text-2xl">{icons[position]}</span>
            </div>
        </div>
    );
}

function LeaderboardRow({ user }) {
    return (
        <div className={`flex items-center gap-4 p-4 ${user.isCurrentUser ? 'bg-blue-500/10' : ''}`}>
            <span className={`w-8 text-center font-black ${user.rank <= 3 ? 'text-amber-400' : 'text-slate-500'
                }`}>
                {user.rank}
            </span>
            <span className="text-2xl">{user.avatar}</span>
            <div className="flex-1">
                <div className={`font-bold ${user.isCurrentUser ? 'text-blue-400' : ''}`}>{user.name}</div>
                <div className="text-xs text-slate-500">Nivel {user.level} • Racha {user.streak}d</div>
            </div>
            <div className="text-right">
                <div className="font-black text-amber-400">{user.xp.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 uppercase">XP</div>
            </div>
        </div>
    );
}
