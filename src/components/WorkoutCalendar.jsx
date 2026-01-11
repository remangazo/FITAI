import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Dumbbell, Calendar, CheckCircle2 } from 'lucide-react';

export default function WorkoutCalendar({ workoutHistory }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    // Get days in month
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const getFirstDayOfMonth = (year, month) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Adjust to start on Monday
    };

    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    // Handle month navigation
    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    // Find workouts for a specific day
    const getWorkoutsForDay = (day) => {
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
        return workoutHistory.filter(w => {
            const wDate = w.startTime instanceof Date ? w.startTime : new Date(w.startTime);
            return wDate.toDateString() === dateStr;
        });
    };

    // Stats for current month
    const monthWorkouts = workoutHistory.filter(w => {
        const wDate = w.startTime instanceof Date ? w.startTime : new Date(w.startTime);
        return wDate.getMonth() === currentDate.getMonth() && wDate.getFullYear() === currentDate.getFullYear();
    });

    const totalVolume = monthWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
    const totalDuration = monthWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);

    return (
        <div className="space-y-8">
            {/* Calendar Header */}
            <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-[24px] border border-white/5 overflow-hidden">
                <button
                    onClick={prevMonth}
                    className="p-3 hover:bg-white/5 rounded-2xl transition-all text-slate-400 hover:text-white"
                >
                    <ChevronLeft size={20} />
                </button>
                <h3 className="font-black capitalize text-sm tracking-[0.2em] text-slate-200">{monthName}</h3>
                <button
                    onClick={nextMonth}
                    className="p-3 hover:bg-white/5 rounded-2xl transition-all text-slate-400 hover:text-white"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-950 p-5 rounded-[28px] text-center border border-white/5 shadow-inner">
                    <div className="text-2xl font-black text-indigo-400 tracking-tighter">{monthWorkouts.length}</div>
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Sesiones</div>
                </div>
                <div className="bg-slate-950 p-5 rounded-[28px] text-center border border-white/5 shadow-inner">
                    <div className="text-2xl font-black text-purple-400 tracking-tighter">{(totalVolume / 1000).toFixed(1)}k</div>
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Volumen</div>
                </div>
                <div className="bg-slate-950 p-5 rounded-[28px] text-center border border-white/5 shadow-inner">
                    <div className="text-2xl font-black text-emerald-400 tracking-tighter">{(totalDuration / 60).toFixed(1)}h</div>
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Tiempo</div>
                </div>
            </div>

            {/* Calendar Grid */}
            <section className="bg-slate-950 rounded-[40px] border border-white/5 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] pointer-events-none" />

                {/* Weekdays */}
                <div className="grid grid-cols-7 mb-4 text-center">
                    {['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'].map(day => (
                        <div key={day} className="text-[10px] text-slate-600 font-black tracking-widest py-2">{day}</div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-2 relative z-10">
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const workouts = getWorkoutsForDay(day);
                        const hasWorkout = workouts.length > 0;
                        const isSelected = selectedDate === day;
                        const isToday = new Date().getDate() === day &&
                            new Date().getMonth() === currentDate.getMonth() &&
                            new Date().getFullYear() === currentDate.getFullYear();

                        return (
                            <motion.button
                                key={day}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => setSelectedDate(isSelected ? null : day)}
                                className={`
                                    aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300
                                    ${isSelected
                                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30'
                                        : hasWorkout
                                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                                            : 'bg-white/[0.02] text-slate-500 hover:bg-white/5 hover:text-slate-300 border border-white/5'}
                                    ${isToday && !isSelected ? 'ring-2 ring-indigo-500/40 ring-offset-4 ring-offset-slate-950' : ''}
                                `}
                            >
                                <span className={`text-sm font-black ${isToday && !isSelected ? 'text-indigo-400' : ''}`}>{day}</span>
                                {hasWorkout && !isSelected && (
                                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </section>

            {/* Selected Day Details */}
            <AnimatePresence mode="wait">
                {selectedDate && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-4"
                    >
                        <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase px-4">
                            Detalles: {new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h4>

                        <div className="space-y-3">
                            {getWorkoutsForDay(selectedDate).length > 0 ? (
                                getWorkoutsForDay(selectedDate).map((workout, idx) => (
                                    <div key={idx} className="bg-slate-950 p-6 rounded-[32px] border border-white/5 flex items-center justify-between transition-all hover:border-indigo-500/30">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                                                <Dumbbell size={22} />
                                            </div>
                                            <div>
                                                <div className="font-black text-white tracking-tight">{workout.routineName || 'Sesión Libre'}</div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                    {workout.exercises?.length || 0} Ejercicios • {Math.round((workout.duration || 0))} min
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
                                            <CheckCircle2 size={18} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 bg-slate-900/10 rounded-[32px] border border-dashed border-white/5">
                                    <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Sin actividad registrada</div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
