import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, MapPin, Calendar, Medal } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { socialService } from '../services/socialService';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { BottomNav } from '../components/Navigation';

const UserProfile = () => {
    const { userId } = useParams();
    const { user: currentUser, profile: currentProfile } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [stats, setStats] = useState({ followers: 0, following: 0, workouts: 0 });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                // Fetch User Doc
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    setProfile(userSnap.data());

                    // Fetch social status
                    if (currentUser) {
                        const following = await socialService.isFollowing(currentUser.uid, userId);
                        setIsFollowing(following);
                    }

                    // Mock stats for MVP (or fetch from subcollections count if implemented)
                    setStats({
                        followers: Math.floor(Math.random() * 100), // Placeholder until count is aggregated
                        following: Math.floor(Math.random() * 50),
                        workouts: userSnap.data().completedWorkouts || 0
                    });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId, currentUser]);

    const handleFollow = async () => {
        if (!currentUser || actionLoading) return;
        setActionLoading(true);
        try {
            if (isFollowing) {
                await socialService.unfollowUser(currentUser.uid, userId);
                setIsFollowing(false);
            } else {
                await socialService.followUser(currentUser.uid, userId, currentProfile);
                setIsFollowing(true);
            }
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Cargando perfil...</div>;
    if (!profile) return <div className="p-8 text-center text-slate-400">Usuario no encontrado</div>;

    return (
        <div className="min-h-screen bg-slate-950 pb-20">
            {/* Header / Cover */}
            <div className="relative h-48 bg-gradient-to-b from-slate-800 to-slate-950">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
            </div>

            {/* Profile Info */}
            <div className="px-4 relative -mt-12">
                <div className="flex flex-col items-center">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-950 overflow-hidden shadow-xl"
                    >
                        {profile.photoURL ? (
                            <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                                <User size={40} />
                            </div>
                        )}
                    </motion.div>

                    <h1 className="mt-3 text-xl font-bold text-white">{profile.displayName || 'Usuario'}</h1>
                    <p className="text-slate-400 text-sm">@{profile.username || 'usuario'}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-8 mt-6 w-full justify-center">
                        <div className="text-center">
                            <div className="font-bold text-white text-lg">{stats.workouts}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider">Entrenos</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-white text-lg">{stats.followers}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider">Seguidores</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-white text-lg">{stats.following}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider">Siguiendo</div>
                        </div>
                    </div>

                    {/* Actions */}
                    {currentUser?.uid !== userId && (
                        <button
                            onClick={handleFollow}
                            disabled={actionLoading}
                            className={`mt-8 w-full max-w-xs py-3 rounded-xl font-bold transition-all shadow-lg ${isFollowing
                                ? 'bg-slate-800 text-slate-300 border border-white/10 hover:bg-slate-700'
                                : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-blue-500/25'
                                }`}
                        >
                            {actionLoading ? 'Procesando...' : isFollowing ? 'Dejar de seguir' : 'Seguir'}
                        </button>
                    )}

                    {/* About Section */}
                    <div className="mt-8 w-full max-w-md space-y-4">
                        <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 space-y-3">
                            <div className="flex items-center gap-3 text-slate-300">
                                <MapPin size={18} className="text-slate-500" />
                                <span className="text-sm">Planeta Tierra</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-300">
                                <Calendar size={18} className="text-slate-500" />
                                <span className="text-sm">Miembro desde {new Date(profile.createdAt?.toDate?.() || Date.now()).getFullYear()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <BottomNav />
        </div>
    );
};

export default UserProfile;
