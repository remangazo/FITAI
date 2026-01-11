import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Users, Calendar, Flame, Timer, ChevronRight, Play, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { challengeService } from '../services/challengeService';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components/Navigation';

// Main Page Component
const Challenges = () => {
    return (
        <div className="min-h-screen bg-slate-950 pb-20 p-4 lg:p-8">
            <div className="max-w-4xl mx-auto mb-4 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500 mb-1">
                    Retos Mensuales
                </h1>
                <p className="text-slate-500 text-xs sm:text-base">Supera tus límites y compite.</p>
            </div>

            <ChallengesList />

            <BottomNav />
        </div>
    );
};

export const ChallengesList = () => {
    const { user, profile } = useAuth();
    const [challenges, setChallenges] = useState([]);
    const [myChallenges, setMyChallenges] = useState({}); // Map of challengeId -> participation data
    const [loading, setLoading] = useState(true);
    const [selectedChallenge, setSelectedChallenge] = useState(null); // For leaderboard modal

    useEffect(() => {
        if (user) {
            loadChallenges();
        }
    }, [user]);

    const loadChallenges = async () => {
        setLoading(true);
        // ensure seeds exist (dev helper)
        await challengeService.seedChallenges();

        const all = await challengeService.getChallenges('active');
        setChallenges(all);

        // Check which ones I've joined
        const myMap = {};
        for (const c of all) {
            const status = await challengeService.getUserChallengeStatus(c.id, user.uid);
            if (status) {
                myMap[c.id] = status;
            }
        }
        setMyChallenges(myMap);
        setLoading(false);
    };

    const navigate = useNavigate();
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const handleJoin = async (challengeId) => {
        // Feature Gating: Gamification is Elite/Premium only
        if (!profile?.isPremium) {
            setShowPremiumModal(true);
            return;
        }

        try {
            await challengeService.joinChallenge(challengeId, user.uid, profile || {});
            // Reload status for this challenge
            const status = await challengeService.getUserChallengeStatus(challengeId, user.uid);
            setMyChallenges(prev => ({ ...prev, [challengeId]: status }));
            alert("¡Te has unido al reto! A darle duro 💪");
        } catch (error) {
            console.error("Join error:", error);
            alert("No se pudo unir al reto");
        }
    };

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-6">
                {loading ? (
                    <div className="text-center py-12 text-slate-500">Cargando retos...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {challenges.map(challenge => (
                            <ChallengeCard
                                key={challenge.id}
                                challenge={challenge}
                                participation={myChallenges[challenge.id]}
                                onJoin={() => handleJoin(challenge.id)}
                                onViewLeaderboard={() => setSelectedChallenge(challenge)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Leaderboard Modal */}
            <AnimatePresence>
                {selectedChallenge && (
                    <LeaderboardModal
                        challenge={selectedChallenge}
                        onClose={() => setSelectedChallenge(null)}
                    />
                )}
            </AnimatePresence>

            {/* Pro Feature Locked Modal */}
            <AnimatePresence>
                {showPremiumModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowPremiumModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 rounded-3xl max-w-sm w-full border border-amber-500/30 overflow-hidden shadow-2xl shadow-amber-900/40"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
                                    <Lock size={32} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Acceso Elite</h3>
                            </div>
                            <div className="p-6 text-center space-y-6">
                                <p className="text-slate-300">
                                    Los <strong>Retos</strong> y <strong>Rankings</strong> son exclusivos para miembros Elite. Compite, gana trofeos y demuestra tu nivel.
                                </p>
                                <button
                                    onClick={() => navigate('/upgrade')}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-900/20 hover:scale-[1.02] transition-transform"
                                >
                                    MEJORAR AHORA
                                </button>
                                <button
                                    onClick={() => setShowPremiumModal(false)}
                                    className="text-slate-500 hover:text-white text-sm font-medium transition-colors"
                                >
                                    Quizás después
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// --- Components ---

export const ChallengeCard = ({ challenge, participation, onJoin, onViewLeaderboard }) => {
    const isJoined = !!participation;
    const progressPercent = isJoined
        ? Math.min((participation.progress / challenge.target) * 100, 100)
        : 0;

    return (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-white/10 group hover:border-white/20 transition-all">
            {/* Background Image / Gradient */}
            <div className="absolute inset-0 z-0">
                {challenge.image ? (
                    <>
                        <img src={challenge.image} alt={challenge.title} className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-all group-hover:scale-105 duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
                    </>
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${challenge.color || 'from-blue-600 to-purple-600'} opacity-20`} />
                )}
            </div>

            <div className="relative z-10 p-6 flex flex-col h-full justify-between min-h-[220px]">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${challenge.color || 'from-blue-500 to-indigo-500'} shadow-lg`}>
                            {challenge.type === 'workouts' ? <Trophy size={20} className="text-white" /> : <Flame size={20} className="text-white" />}
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-black/40 px-2 py-1 rounded-full backdrop-blur">
                            {challenge.participantsCount || 0} participantes
                        </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{challenge.title}</h3>
                    <p className="text-sm text-slate-300 mb-4 line-clamp-2">{challenge.description}</p>
                </div>

                <div>
                    {isJoined ? (
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm font-bold">
                                <span className={participation.completed ? "text-green-400" : "text-blue-400"}>
                                    {participation.progress} / {challenge.target} {challenge.type}
                                </span>
                                <span className="text-slate-500">{Math.round(progressPercent)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    className={`h-full ${participation.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                                />
                            </div>
                            <button
                                onClick={onViewLeaderboard}
                                className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-slate-300 transition-colors flex items-center justify-center gap-2"
                            >
                                <Users size={16} /> Ver Leaderboard
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={onJoin}
                                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                                    // Check premium visually? No, handleJoin handles logic. Just showing button as normal or maybe with a star?
                                    // Let's keep it inviting but handle logic in onJoin
                                    "bg-white text-slate-900 hover:bg-slate-200"
                                    }`}
                            >
                                <Play size={18} fill="currentColor" /> Unirse
                            </button>
                            <button
                                onClick={onViewLeaderboard}
                                className="px-4 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors"
                            >
                                <Users size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const LeaderboardModal = ({ challenge, onClose }) => {
    const [participants, setParticipants] = useState([]);

    useEffect(() => {
        challengeService.getLeaderboard(challenge.id).then(setParticipants);
    }, [challenge]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 rounded-3xl max-w-md w-full max-h-[70vh] flex flex-col border border-white/10 shadow-2xl"
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-white">Leaderboard</h3>
                        <p className="text-xs text-slate-400">{challenge.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                <div className="overflow-y-auto p-4 space-y-2 flex-1 scrollbar-hide">
                    {participants.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">Aún no hay participantes en el ranking.</div>
                    ) : (
                        participants.map((p, idx) => (
                            <div key={p.id || idx} className={`flex items-center gap-4 p-3 rounded-xl border ${idx < 3 ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-white/10' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
                                <div className={`w-8 h-8 flex items-center justify-center font-black text-lg ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-orange-400' : 'text-slate-600'}`}>
                                    {idx + 1}
                                </div>
                                <div className="w-10 h-10 rounded-full bg-slate-700 bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${p.userPhoto || 'https://via.placeholder.com/150'})` }} />
                                <div className="flex-1">
                                    <h4 className="font-bold text-white text-sm">{p.userName}</h4>
                                    <div className="text-xs text-slate-500 font-mono">ID: {p.userId.substring(0, 6)}...</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-white">{p.score}</div>
                                    <div className="text-[10px] uppercase text-slate-500 font-bold">{challenge.type}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Challenges;
