import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ExternalLink, Youtube, Twitch, Radio } from 'lucide-react';

/**
 * InfluencerLiveBanner Component
 * Displays a global "Live" notification when a coach is streaming.
 */
export default function InfluencerLiveBanner({ isLive, platform, streamUrl, coachName, coachAvatar }) {
    if (!isLive) return null;

    const getPlatformIcon = () => {
        switch (platform?.toLowerCase()) {
            case 'youtube': return <Youtube size={16} />;
            case 'twitch': return <Twitch size={16} />;
            default: return <Radio size={16} />;
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="relative z-40 mb-4 sm:mb-8 overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-indigo-600/20 to-red-600/20 blur-xl group-hover:opacity-100 opacity-50 transition-opacity duration-500"></div>

                <a
                    href={streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block p-3 sm:p-5 rounded-[24px] sm:rounded-[32px] bg-slate-900/40 border border-white/5 backdrop-blur-md hover:border-red-500/30 transition-all duration-300 shadow-2xl overflow-hidden"
                >
                    {/* Animated Pulse Background */}
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-1000 hidden sm:block">
                        {getPlatformIcon()}
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                        {/* Coach Avatar with Pulse */}
                        <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-red-500/30">
                                <img
                                    src={coachAvatar || "/api/placeholder/64/64"}
                                    alt={coachName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -top-1 -right-1 flex h-3 w-3 sm:h-4 sm:w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 bg-red-500 border-2 border-slate-950"></span>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                                <span className="text-[8px] sm:text-[10px] font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-1.5 leading-none">
                                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                    En Vivo
                                </span>
                            </div>
                            <h4 className="text-white font-black text-sm sm:text-lg tracking-tight leading-tight truncate">
                                {coachName} está transmitiendo
                            </h4>
                            <p className="text-slate-400 text-[9px] sm:text-xs font-medium mt-0.5 sm:mt-1 truncate sm:whitespace-normal">
                                Únete ahora al directo.
                            </p>
                        </div>

                        {/* Action Button */}
                        <div className="bg-red-600 hover:bg-red-500 text-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg shadow-red-600/20 transition-all group-hover:scale-105 active:scale-95 flex-shrink-0">
                            <Play size={16} className="sm:hidden" fill="currentColor" />
                            <Play size={20} className="hidden sm:block" fill="currentColor" />
                        </div>
                    </div>

                    {/* Footer - Only visible on desktop or large screens to save space on mobile */}
                    <div className="mt-3 pt-2 border-t border-white/5 hidden sm:flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                            {getPlatformIcon()}
                            <span>Streaming en {platform || 'Directo'}</span>
                        </div>
                        <ExternalLink size={12} className="text-slate-600 group-hover:text-red-400 transition-colors" />
                    </div>
                </a>
            </motion.div>
        </AnimatePresence>
    );
}
