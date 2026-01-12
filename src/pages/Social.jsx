import React, { useState, useEffect } from 'react';
import { Search, Users, Activity, Trophy, ArrowRight, Flame, Dumbbell, Crown, UserPlus, Zap, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { socialService } from '../services/socialService';
import UserCard from '../components/social/UserCard';
import EmptyFeedEnhanced from '../components/social/EmptyFeedEnhanced';
import { ActivityCard, LeaderboardCard, LiveTrainingSection, WorkoutBuddyCard } from '../components/social/SocialComponents';
import { ChallengesList } from './Challenges';
import { BottomNav, TopNav } from '../components/Navigation';
import { DEMO_ACTIVITIES, DEMO_LEADERBOARD, DEMO_USERS, DEMO_WORKOUT_BUDDIES } from '../data/demoSocialData';

const AnimatedMeshGradient = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
            animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                x: [-100, 100, -100],
                y: [-100, 100, -100],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-600/10 blur-[120px]"
        />
        <motion.div
            animate={{
                scale: [1.2, 1, 1.2],
                rotate: [0, -90, 0],
                x: [100, -100, 100],
                y: [100, -100, 100],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-purple-600/10 blur-[120px]"
        />
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
    </div>
);

const Social = () => {
    const { user, profile, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('feed');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [myFollowing, setMyFollowing] = useState(new Set());
    const [feedPosts, setFeedPosts] = useState([]);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [demoMode, setDemoMode] = useState(false); // Demo mode disabled by default
    const [liveUsersList, setLiveUsersList] = useState([]);
    const [leaderboardCategory, setLeaderboardCategory] = useState('workouts');

    // Load who I follow to update button states correctly
    useEffect(() => {
        if (!user) return;
        socialService.getFollowing(user.uid).then(following => {
            setMyFollowing(new Set(following.map(u => u.id)));
        });
    }, [user]);

    // Handle search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 3) {
                setIsSearching(true);
                try {
                    const results = await socialService.searchUsers(searchTerm);
                    setSearchResults(results);
                } catch (error) {
                    console.error("Search error", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        if (activeTab === 'feed' && !demoMode) {
            loadFeed();
            loadLiveUsers();
        }
        if (activeTab === 'leaderboard' && !demoMode) {
            loadLeaderboard();
        }
    }, [activeTab, demoMode, leaderboardCategory]);

    const loadLiveUsers = async () => {
        if (!user) return;
        const live = await socialService.getLiveTrainers(user.uid);
        setLiveUsersList(live);
    };

    const loadLeaderboard = async () => {
        try {
            const data = await socialService.getLeaderboard(leaderboardCategory);
            const mapped = data.map(u => ({
                id: u.id,
                name: u.displayName || 'Atleta',
                avatar: u.displayName?.charAt(0) || '👤',
                avatarUrl: u.photoURL,
                value: leaderboardCategory === 'workouts' ? (u.totalWorkouts || 0) : (u.totalVolume || 0),
                unit: leaderboardCategory === 'workouts' ? 'Wkts' : 'kg',
                level: u.level || 1
            }));
            setLeaderboardData(mapped);
        } catch (error) {
            console.error('[Social] Error loading leaderboard:', error);
        }
    };

    const formatTimeAgo = (date) => {
        if (!date) return 'Recientemente';
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Hace un momento';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
        return date.toLocaleDateString();
    };

    const loadFeed = async () => {
        try {
            const posts = await socialService.getSocialFeed();
            // Map posts to ActivityCard format
            const mappedPosts = posts.map(post => ({
                id: post.id,
                type: 'workout',
                user: {
                    name: post.userName || 'Usuario',
                    avatarUrl: post.userPhoto,
                    avatar: post.userName?.charAt(0) || 'U',
                    level: post.userLevel || 1,
                    isPremium: false,
                    isLive: false // Feed posts are historical
                },
                workout: {
                    name: post.workout?.name || 'Entrenamiento',
                    duration: post.workout?.duration || 0,
                    calories: post.workout?.calories || 0,
                    totalSets: post.workout?.totalSets || 0,
                    exercises: post.workout?.exercises || [],
                    prs: post.workout?.prs || []
                },
                timeAgo: formatTimeAgo(post.createdAt?.toDate?.() || post.createdAt)
            }));
            setFeedPosts(mappedPosts);
        } catch (error) {
            console.error('[Social] Error loading feed:', error);
        }
    };

    const handleKudos = (activityId) => {
        console.log('Kudos given to:', activityId);
        if (!user) return;
        socialService.giveKudos(user.uid, activityId, {
            displayName: profile?.name || user.displayName,
            photoURL: profile?.photoURL || user.photoURL
        });
    };

    const handleConnectBuddy = (buddy) => {
        console.log('Connecting with buddy:', buddy);
        // Navigate to chat or send connection request
    };

    // Get live users
    const liveUsers = demoMode ? DEMO_USERS.filter(u => u.isLive) : liveUsersList;

    // Tabs config
    const tabs = [
        { id: 'feed', icon: Activity, label: 'Feed' },
        { id: 'leaderboard', icon: Trophy, label: 'Ranking' },
        { id: 'explore', icon: Search, label: 'Explorar' },
        { id: 'challenges', icon: Flame, label: 'Retos' }
    ];

    return (
        <div className="min-h-screen bg-slate-950 pb-20 lg:pb-0 relative">
            <AnimatedMeshGradient />

            <div className="hidden md:block relative z-10">
                <TopNav user={user} profile={profile} onLogout={logout} />
            </div>

            <div className="pt-3 sm:pt-6 px-4 max-w-2xl mx-auto space-y-6 relative z-10">
                {/* Header Redesign */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 tracking-tight">
                                Comunidad
                            </h1>
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Global Live</span>
                            </div>
                        </div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Conecta • Compite • Crece</p>
                    </div>

                    <button
                        onClick={() => setDemoMode(!demoMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${demoMode
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-slate-900 text-slate-500 border border-white/5'
                            }`}
                    >
                        <Zap size={14} className={demoMode ? 'animate-pulse' : ''} />
                        Demo {demoMode ? 'ON' : 'OFF'}
                    </button>
                </div>

                {/* Stories Style Section */}
                {liveUsers.length > 0 && (
                    <div className="py-2">
                        <LiveTrainingSection liveUsers={liveUsers} />
                    </div>
                )}

                {/* Tabs */}
                <div className="flex bg-slate-800/50 p-1 rounded-xl backdrop-blur-sm border border-white/5">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-slate-700 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <tab.icon size={14} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {/* Feed Tab */}
                    {activeTab === 'feed' && (
                        <motion.div
                            key="feed"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {demoMode ? (
                                <>
                                    {/* Workout Buddies Suggestion */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                                <UserPlus size={14} className="text-purple-400" />
                                                Compañeros sugeridos
                                            </h3>
                                            <button className="text-xs text-blue-400 hover:underline">Ver más</button>
                                        </div>
                                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                            {DEMO_WORKOUT_BUDDIES.map(buddy => (
                                                <div key={buddy.id} className="flex-shrink-0 w-64">
                                                    <WorkoutBuddyCard
                                                        buddy={buddy}
                                                        onConnect={handleConnectBuddy}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Activity Feed */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                            <Activity size={14} className="text-blue-400" />
                                            Actividad reciente
                                        </h3>
                                        {DEMO_ACTIVITIES.map(activity => (
                                            <ActivityCard
                                                key={activity.id}
                                                activity={activity}
                                                onKudos={handleKudos}
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    {/* Real Posts First */}
                                    {feedPosts.map(post => (
                                        <ActivityCard
                                            key={post.id}
                                            activity={post}
                                            onKudos={() => handleKudos(post.id)}
                                        />
                                    ))}

                                    {/* Then Fill with Demo */}
                                    <div className="pt-4 border-t border-white/5">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">
                                            Sugerencias de la Comunidad
                                        </h3>
                                        <div className="space-y-4 opacity-80">
                                            {DEMO_ACTIVITIES.slice(0, 3).map(activity => (
                                                <ActivityCard
                                                    key={activity.id}
                                                    activity={activity}
                                                    onKudos={() => handleKudos(activity.id)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Leaderboard Tab */}
                    {activeTab === 'leaderboard' && (
                        <motion.div
                            key="leaderboard"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <LeaderboardCard
                                data={demoMode ? DEMO_LEADERBOARD[leaderboardCategory] : (leaderboardData.length > 0 ? leaderboardData : DEMO_LEADERBOARD[leaderboardCategory])}
                                category={leaderboardCategory}
                                onCategoryChange={setLeaderboardCategory}
                            />

                            {/* Your Position */}
                            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl">
                                        {profile?.name?.charAt(0) || '👤'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white">{profile?.name || 'Tú'}</div>
                                        <div className="text-xs text-slate-400">Tu posición actual</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-blue-400">
                                            #{!demoMode && leaderboardData.length > 0
                                                ? (leaderboardData.findIndex(u => u.id === user?.uid) + 1 || '?')
                                                : '6'}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                            {!demoMode && leaderboardData.length > 0 ? 'En tiempo real' : '+2 esta semana'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Explore Tab */}
                    {activeTab === 'explore' && (
                        <motion.div
                            key="explore"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar atletas..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>

                            {/* Demo users when in demo mode */}
                            {demoMode && searchTerm.length < 3 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-white">Atletas destacados</h3>
                                    {DEMO_USERS.map(demoUser => (
                                        <motion.div
                                            key={demoUser.id}
                                            className="bg-slate-800/50 border border-white/10 rounded-2xl p-4 flex items-center gap-3"
                                            whileHover={{ scale: 1.01 }}
                                        >
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl">
                                                    {demoUser.avatar}
                                                </div>
                                                {demoUser.isPremium && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                                                        <Crown size={10} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-white text-sm">{demoUser.name}</div>
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <span>Nivel {demoUser.level}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Flame size={10} className="text-orange-400" />
                                                        {demoUser.streak} días
                                                    </span>
                                                </div>
                                            </div>
                                            <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                                                Seguir
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-2">
                                {isSearching ? (
                                    <div className="text-center py-8 text-slate-500">Buscando...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(u => (
                                        <UserCard
                                            key={u.id}
                                            user={u}
                                            isFollowingInitially={myFollowing.has(u.id)}
                                        />
                                    ))
                                ) : searchTerm.length >= 3 ? (
                                    <div className="text-center py-8 text-slate-500">No se encontraron usuarios</div>
                                ) : !demoMode ? (
                                    <div className="text-center py-8 text-slate-500">
                                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>Escribe para buscar compañeros</p>
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    )}

                    {/* Challenges Tab */}
                    {activeTab === 'challenges' && (
                        <motion.div
                            key="challenges"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <ChallengesList />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <BottomNav />
        </div>
    );
};

export default Social;
