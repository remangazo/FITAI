import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const TabataTimer = () => {
    const [config, setConfig] = useState({ work: 20, rest: 10, rounds: 8 });
    const [timeLeft, setTimeLeft] = useState(20);
    const [currentRound, setCurrentRound] = useState(1);
    const [status, setStatus] = useState('idle'); // idle, work, rest, finished
    const [isActive, setIsActive] = useState(false);
    const [muted, setMuted] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const timerRef = useRef(null);
    const beepRef = useRef(null); // Would use Audio object here

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handlePhaseChange();
        }

        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const playSound = (freq = 440) => {
        if (muted) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            // Ignore auto-play errors
        }
    };

    const handlePhaseChange = () => {
        clearInterval(timerRef.current);
        playSound(880); // High beep for phase change

        if (status === 'work') {
            if (currentRound < config.rounds) {
                setStatus('rest');
                setTimeLeft(config.rest);
            } else {
                setStatus('finished');
                setIsActive(false);
                playSound(1200); // Victory sound
            }
        } else if (status === 'rest') {
            setCurrentRound(prev => prev + 1);
            setStatus('work');
            setTimeLeft(config.work);
        } else if (status === 'idle') {
            setStatus('work');
            setTimeLeft(config.work);
        }
    };

    const toggleTimer = () => {
        if (status === 'idle') {
            setStatus('work');
            setTimeLeft(config.work);
        }
        setIsActive(!isActive);
    };

    const reset = () => {
        setIsActive(false);
        setStatus('idle');
        setCurrentRound(1);
        setTimeLeft(config.work);
        clearInterval(timerRef.current);
    };

    const getProgress = () => {
        const total = status === 'work' ? config.work : config.rest;
        return ((total - timeLeft) / total) * 100;
    };

    return (
        <div className="bg-slate-900 rounded-3xl p-8 border border-white/10 text-center relative overflow-hidden">
            {/* Background Pulse */}
            <div className={`absolute inset-0 transition-opacity duration-500 opacity-20 pointer-events-none ${status === 'work' ? 'bg-green-500/20 animate-pulse' :
                    status === 'rest' ? 'bg-orange-500/20' : ''
                }`} />

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => setShowSettings(!showSettings)} className="text-slate-400 hover:text-white">
                        <Settings size={20} />
                    </button>
                    <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-200">Tabata</h2>
                    <button onClick={() => setMuted(!muted)} className="text-slate-400 hover:text-white">
                        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>

                {showSettings && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="mb-6 bg-slate-800/50 p-4 rounded-xl overflow-hidden">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <label>
                                Trab (s)
                                <input type="number" value={config.work} onChange={e => setConfig({ ...config, work: Number(e.target.value) })} className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 mt-1" />
                            </label>
                            <label>
                                Desc (s)
                                <input type="number" value={config.rest} onChange={e => setConfig({ ...config, rest: Number(e.target.value) })} className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 mt-1" />
                            </label>
                            <label>
                                Rondas
                                <input type="number" value={config.rounds} onChange={e => setConfig({ ...config, rounds: Number(e.target.value) })} className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 mt-1" />
                            </label>
                        </div>
                    </motion.div>
                )}

                {/* Circular Timer Display */}
                <div className="w-64 h-64 mx-auto mb-8 relative flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="128" cy="128" r="120" stroke="#1e293b" strokeWidth="8" fill="none" />
                        <motion.circle
                            cx="128" cy="128" r="120"
                            stroke={status === 'work' ? '#22c55e' : status === 'rest' ? '#f97316' : '#94a3b8'}
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray="753"
                            strokeDashoffset={753 - (753 * getProgress()) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-6xl font-black font-mono ${status === 'work' ? 'text-green-400' : status === 'rest' ? 'text-orange-400' : 'text-slate-200'
                            }`}>
                            {timeLeft}
                        </span>
                        <span className="uppercase text-sm font-bold tracking-widest text-slate-500 mt-2">
                            {status === 'idle' ? 'LISTO' : status === 'finished' ? 'FIN' : status === 'work' ? 'TRABAJO' : 'DESCANSO'}
                        </span>
                    </div>
                </div>

                <div className="text-xl font-bold mb-8">
                    Ronda {currentRound} / {config.rounds}
                </div>

                <div className="flex justify-center gap-6">
                    <button
                        onClick={toggleTimer}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-amber-500 hover:bg-amber-400' : 'bg-blue-600 hover:bg-blue-500'
                            } text-white shadow-lg`}
                    >
                        {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>
                    <button
                        onClick={reset}
                        className="w-16 h-16 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-all"
                    >
                        <RotateCcw size={28} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TabataTimer;
