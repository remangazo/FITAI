import React, { useState, useEffect } from 'react';
import { User, UserPlus, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { socialService } from '../../services/socialService';

const UserCard = ({ user, isFollowingInitially = false }) => {
    const { user: currentUser, profile } = useAuth();
    const [isFollowing, setIsFollowing] = useState(isFollowingInitially);
    const [loading, setLoading] = useState(false);

    // If initial state is unknown, we could check it here, 
    // but better to pass it from parent for performance in lists.

    const handleFollowToggle = async (e) => {
        e.preventDefault(); // Prevent navigation if wrapped in Link
        if (loading) return;
        setLoading(true);
        try {
            if (isFollowing) {
                await socialService.unfollowUser(currentUser.uid, user.id);
                setIsFollowing(false);
            } else {
                await socialService.followUser(currentUser.uid, user.id, profile);
                setIsFollowing(true);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
        } finally {
            setLoading(false);
        }
    };

    if (user.id === currentUser?.uid) return null; // Don't show self

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[28px] p-5 flex items-center justify-between hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 shadow-xl"
        >
            <Link to={`/user/${user.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-[1px] border border-white/10 group-hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden shadow-inner">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-xl">👤</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="min-w-0">
                    <h3 className="font-black text-white text-[15px] tracking-tight truncate group-hover:text-blue-400 transition-colors">
                        {user.displayName || 'Atleta Élite'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">@{user.username || 'usuario'}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">Online</span>
                    </div>
                </div>
            </Link>

            <button
                onClick={handleFollowToggle}
                disabled={loading}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${isFollowing
                    ? 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                    : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95'
                    }`}
            >
                {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : isFollowing ? (
                    <>
                        <UserCheck size={14} className="opacity-60" />
                        Siguiendo
                    </>
                ) : (
                    <>
                        <UserPlus size={14} />
                        Seguir
                    </>
                )}
            </button>
        </motion.div>
    );
};

export default UserCard;
