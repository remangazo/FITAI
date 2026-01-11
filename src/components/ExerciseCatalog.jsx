import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXERCISES, MUSCLE_GROUPS } from '../data/exercises';
import { Search, Play, Info, X, Filter, ChevronDown } from 'lucide-react';

export default function ExerciseCatalog() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    const filteredExercises = EXERCISES.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMuscle = !selectedMuscle || ex.muscleGroup === selectedMuscle;
        return matchesSearch && matchesMuscle;
    });

    const exercisesByGroup = MUSCLE_GROUPS.map(group => ({
        ...group,
        exercises: filteredExercises.filter(ex => ex.muscleGroup === group.id)
    })).filter(g => g.exercises.length > 0);

    return (
        <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar ejercicio..."
                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center justify-center gap-2 bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold"
                >
                    <Filter size={16} />
                    Filtros
                    <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Muscle Filter Pills */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex gap-2 flex-wrap pb-2">
                            <button
                                onClick={() => setSelectedMuscle(null)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!selectedMuscle ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-white/5'
                                    }`}
                            >
                                Todos ({EXERCISES.length})
                            </button>
                            {MUSCLE_GROUPS.map(mg => {
                                const count = EXERCISES.filter(e => e.muscleGroup === mg.id).length;
                                return (
                                    <button
                                        key={mg.id}
                                        onClick={() => setSelectedMuscle(mg.id === selectedMuscle ? null : mg.id)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${selectedMuscle === mg.id ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-white/5'
                                            }`}
                                    >
                                        <span>{mg.icon}</span>
                                        {mg.name} ({count})
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Count */}
            <div className="text-sm text-slate-500">
                Mostrando <span className="text-white font-bold">{filteredExercises.length}</span> ejercicios
            </div>

            {/* Exercise Grid by Group or Flat */}
            {selectedMuscle ? (
                // Flat list when filtered
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredExercises.map((ex) => (
                        <ExerciseCard key={ex.id} exercise={ex} onClick={() => setSelectedExercise(ex)} />
                    ))}
                </div>
            ) : (
                // Grouped by muscle
                <div className="space-y-8">
                    {exercisesByGroup.map(group => (
                        <div key={group.id}>
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <span className="text-2xl">{group.icon}</span>
                                {group.name}
                                <span className="text-slate-600 text-sm font-normal">({group.exercises.length})</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {group.exercises.slice(0, 6).map((ex) => (
                                    <ExerciseCard key={ex.id} exercise={ex} onClick={() => setSelectedExercise(ex)} />
                                ))}
                            </div>
                            {group.exercises.length > 6 && (
                                <button
                                    onClick={() => setSelectedMuscle(group.id)}
                                    className="mt-4 text-blue-400 text-sm font-bold hover:text-blue-300"
                                >
                                    Ver todos ({group.exercises.length}) →
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Exercise Detail Modal */}
            <AnimatePresence>
                {selectedExercise && (
                    <ExerciseModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}

function ExerciseCard({ exercise, onClick }) {
    const muscleGroup = MUSCLE_GROUPS.find(m => m.id === exercise.muscleGroup);
    return (
        <motion.div
            whileHover={{ y: -4 }}
            onClick={onClick}
            className="glass p-5 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all group cursor-pointer"
        >
            <div className="flex justify-between items-start mb-3">
                <span className="bg-blue-500/10 text-blue-400 text-[10px] uppercase font-bold px-2 py-1 rounded-full border border-blue-500/20 flex items-center gap-1">
                    {muscleGroup?.icon} {muscleGroup?.name}
                </span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${exercise.level === 'Principiante' ? 'bg-green-500/10 text-green-400' :
                        exercise.level === 'Intermedio' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-red-500/10 text-red-400'
                    }`}>
                    {exercise.level}
                </span>
            </div>
            <h3 className="font-bold text-lg mb-1 leading-tight">{exercise.name}</h3>
            <p className="text-slate-400 text-xs line-clamp-2 mb-4">{exercise.description}</p>
            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1 uppercase">
                    <Filter size={10} /> {exercise.equipment}
                </span>
                <span className="flex items-center gap-1 uppercase text-blue-400">
                    <Play size={10} /> Ver
                </span>
            </div>
        </motion.div>
    );
}

function ExerciseModal({ exercise, onClose }) {
    const muscleGroup = MUSCLE_GROUPS.find(m => m.id === exercise.muscleGroup);

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
                className="bg-slate-900 border border-white/10 rounded-[32px] w-full max-w-2xl overflow-hidden relative z-10 max-h-[90vh] overflow-y-auto"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white z-20"
                >
                    <X size={20} />
                </button>

                {/* Video */}
                <div className="aspect-video w-full bg-black">
                    <iframe
                        className="w-full h-full"
                        src={exercise.videoUrl}
                        title={exercise.name}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    <div className="flex flex-wrap gap-2">
                        <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1">
                            {muscleGroup?.icon} {muscleGroup?.name}
                        </span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${exercise.level === 'Principiante' ? 'bg-green-500/10 text-green-400' :
                                exercise.level === 'Intermedio' ? 'bg-yellow-500/10 text-yellow-400' :
                                    'bg-red-500/10 text-red-400'
                            }`}>
                            {exercise.level}
                        </span>
                        <span className="bg-slate-800 text-slate-400 text-xs font-bold px-3 py-1 rounded-full">
                            {exercise.equipment}
                        </span>
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold mb-2">{exercise.name}</h2>
                        <p className="text-slate-400 leading-relaxed">{exercise.description}</p>
                    </div>

                    {/* Muscles */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5">
                            <h4 className="text-xs font-bold text-blue-400 mb-2 uppercase">Músculos Principales</h4>
                            <div className="flex flex-wrap gap-2">
                                {exercise.primaryMuscles?.map((m, i) => (
                                    <span key={i} className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-lg">{m}</span>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5">
                            <h4 className="text-xs font-bold text-purple-400 mb-2 uppercase">Músculos Secundarios</h4>
                            <div className="flex flex-wrap gap-2">
                                {exercise.secondaryMuscles?.length > 0 ? exercise.secondaryMuscles.map((m, i) => (
                                    <span key={i} className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-lg">{m}</span>
                                )) : <span className="text-slate-600 text-xs">Ninguno</span>}
                            </div>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
                        <h4 className="font-bold text-green-400 mb-3 flex items-center gap-2">
                            <Info size={18} /> Tips Pro de FITAI
                        </h4>
                        <ul className="space-y-2">
                            {exercise.tips?.map((tip, i) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="text-green-500 mt-1">✓</span> {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
