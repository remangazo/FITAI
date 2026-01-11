import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight, ChevronLeft, Save, Plus, Trash2, GripVertical,
    Search, Filter, Dumbbell, X, Check, Calendar
} from 'lucide-react';
import { EXERCISES, MUSCLE_GROUPS, getExercisesByMuscle } from '../data/exercises';
import { PageHeader, AppLayout } from './Navigation';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const TRAINING_TECHNIQUES = [
    { id: 'normal', label: 'Normal', icon: '', description: 'Serie estándar' },
    { id: 'superset', label: 'Superserie', icon: '🔗', description: 'Sin descanso con otro ejercicio' },
    { id: 'dropset', label: 'Drop Set', icon: '⬇️', description: 'Reducir peso sin descanso' },
    { id: 'restpause', label: 'Rest-Pause', icon: '⏸️', description: 'Pausas breves de 10-15s' },
    { id: 'pyramid', label: 'Piramidal', icon: '📈', description: 'Aumentar/disminuir peso' },
    { id: 'cluster', label: 'Cluster Set', icon: '🔹', description: 'Micro-pausas entre reps' },
];

export default function RoutineBuilder({ onSave }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [routineName, setRoutineName] = useState('');
    const [selectedDay, setSelectedDay] = useState('Lunes');
    const [routineDays, setRoutineDays] = useState({
        Lunes: [], Martes: [], Miércoles: [], Jueves: [], Viernes: [], Sábado: [], Domingo: []
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState(null);
    const [supersetPairing, setSupersetPairing] = useState(null); // { day, tempId, exerciseName }

    // Handle superset pairing
    const handleTechniqueChange = (day, tempId, technique) => {
        if (technique === 'superset') {
            // Open pairing modal
            const exercise = routineDays[day].find(ex => ex.tempId === tempId);
            setSupersetPairing({
                day,
                tempId,
                exerciseName: exercise.name,
                muscleGroup: exercise.muscleGroup
            });
        } else {
            // Clear any existing pairing
            updateExercise(day, tempId, 'technique', technique);
            updateExercise(day, tempId, 'pairedWith', null);
        }
    };

    const handlePairExercise = (pairedExercise) => {
        if (!supersetPairing) return;
        setRoutineDays(prev => ({
            ...prev,
            [supersetPairing.day]: prev[supersetPairing.day].map(ex => {
                if (ex.tempId === supersetPairing.tempId) {
                    return { ...ex, technique: 'superset', pairedWith: pairedExercise.name };
                }
                return ex;
            })
        }));
        setSupersetPairing(null);
    };

    const filteredExercises = EXERCISES.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMuscle = !selectedMuscle || ex.muscleGroup === selectedMuscle;
        return matchesSearch && matchesMuscle;
    });

    const addExerciseToDay = (exercise) => {
        const newExercise = {
            ...exercise,
            tempId: Date.now(),
            sets: 3,
            reps: '10-12',
            weight: '',
            restSeconds: 90,
            technique: 'normal'
        };
        setRoutineDays(prev => ({
            ...prev,
            [selectedDay]: [...prev[selectedDay], newExercise]
        }));
    };

    const removeExercise = (day, tempId) => {
        setRoutineDays(prev => ({
            ...prev,
            [day]: prev[day].filter(ex => ex.tempId !== tempId)
        }));
    };

    const updateExercise = (day, tempId, field, value) => {
        setRoutineDays(prev => ({
            ...prev,
            [day]: prev[day].map(ex => ex.tempId === tempId ? { ...ex, [field]: value } : ex)
        }));
    };

    const reorderExercises = (day, newOrder) => {
        setRoutineDays(prev => ({ ...prev, [day]: newOrder }));
    };

    const totalExercises = Object.values(routineDays).flat().length;
    const activeDays = Object.entries(routineDays).filter(([_, exs]) => exs.length > 0).map(([day]) => day);

    const handleSave = () => {
        if (!routineName || totalExercises === 0) return;
        onSave?.({
            name: routineName,
            days: routineDays,
            activeDays,
            createdAt: new Date().toISOString(),
            isManual: true
        });
        navigate('/routines');
    };

    return (
        <div className="space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3].map(s => (
                    <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                            }`}>
                            {step > s ? <Check size={16} /> : s}
                        </div>
                        {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-blue-600' : 'bg-slate-800'}`} />}
                    </div>
                ))}
                <span className="ml-4 text-sm text-slate-400">
                    {step === 1 && 'Nombre'}
                    {step === 2 && 'Ejercicios'}
                    {step === 3 && 'Revisar'}
                </span>
            </div>

            <AnimatePresence mode="wait">
                {/* STEP 1: Name */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass p-8 rounded-[32px] border border-white/5 max-w-xl mx-auto"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Dumbbell className="text-blue-500" size={32} />
                            </div>
                            <h2 className="text-2xl font-black">Crear Nueva Rutina</h2>
                            <p className="text-slate-400 text-sm mt-1">Dale un nombre épico a tu plan de entrenamiento</p>
                        </div>
                        <div className="space-y-2 mb-8">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nombre</label>
                            <input
                                type="text"
                                value={routineName}
                                onChange={(e) => setRoutineName(e.target.value)}
                                placeholder="Ej: Push Pull Legs - Hipertrofia"
                                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            disabled={!routineName}
                            onClick={() => setStep(2)}
                            className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-400 transition-colors"
                        >
                            Continuar <ChevronRight size={20} />
                        </button>
                    </motion.div>
                )}

                {/* STEP 2: Build Routine */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* Day Selector */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {DAYS.map(day => (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${selectedDay === day
                                        ? 'bg-blue-600 text-white'
                                        : routineDays[day].length > 0
                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                            : 'bg-slate-900 text-slate-500 border border-white/5'
                                        }`}
                                >
                                    {day.slice(0, 3)}
                                    {routineDays[day].length > 0 && (
                                        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                                            {routineDays[day].length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Exercise Catalog */}
                            <div className="glass p-6 rounded-[32px] border border-white/5">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <Plus size={18} className="text-blue-400" /> Agregar Ejercicios
                                </h3>

                                {/* Search & Filter */}
                                <div className="flex gap-2 mb-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-slate-900 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Muscle Filter Pills */}
                                <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
                                    <button
                                        onClick={() => setSelectedMuscle(null)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${!selectedMuscle ? 'bg-blue-600' : 'bg-slate-800 text-slate-400'
                                            }`}
                                    >
                                        Todos
                                    </button>
                                    {MUSCLE_GROUPS.map(mg => (
                                        <button
                                            key={mg.id}
                                            onClick={() => setSelectedMuscle(mg.id)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1 ${selectedMuscle === mg.id ? 'bg-blue-600' : 'bg-slate-800 text-slate-400'
                                                }`}
                                        >
                                            {mg.icon} {mg.name}
                                        </button>
                                    ))}
                                </div>

                                {/* Exercise List */}
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredExercises.map(ex => (
                                        <div
                                            key={ex.id}
                                            onClick={() => addExerciseToDay(ex)}
                                            className="bg-slate-900/50 p-3 rounded-xl border border-white/5 hover:border-blue-500/30 cursor-pointer flex items-center justify-between group transition-all"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">{ex.name}</div>
                                                <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                                    <span>{MUSCLE_GROUPS.find(m => m.id === ex.muscleGroup)?.name}</span>
                                                    <span>•</span>
                                                    <span>{ex.equipment}</span>
                                                </div>
                                            </div>
                                            <Plus size={16} className="text-slate-600 group-hover:text-blue-400 flex-shrink-0 ml-2" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Selected Day Exercises */}
                            <div className="glass p-6 rounded-[32px] border border-white/5">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <Calendar size={18} className="text-purple-400" /> {selectedDay}
                                    <span className="text-slate-500 text-sm font-normal">({routineDays[selectedDay].length} ejercicios)</span>
                                </h3>

                                {routineDays[selectedDay].length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                                        <p className="text-slate-600 text-sm">Hacé click en un ejercicio para agregarlo a {selectedDay}</p>
                                    </div>
                                ) : (
                                    <Reorder.Group
                                        axis="y"
                                        values={routineDays[selectedDay]}
                                        onReorder={(newOrder) => reorderExercises(selectedDay, newOrder)}
                                        className="space-y-3"
                                    >
                                        {routineDays[selectedDay].map((ex, idx) => (
                                            <Reorder.Item
                                                key={ex.tempId}
                                                value={ex}
                                                className="bg-slate-900/70 p-4 rounded-2xl border border-white/5 cursor-grab active:cursor-grabbing"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="text-slate-600 mt-1">
                                                        <GripVertical size={18} />
                                                    </div>
                                                    <div className="flex-1 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <span className="text-[10px] text-blue-400 font-bold">{idx + 1}.</span>
                                                                <span className="font-bold text-sm ml-1">{ex.name}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => removeExercise(selectedDay, ex.tempId)}
                                                                className="text-slate-600 hover:text-red-400 p-1"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            <div>
                                                                <label className="text-[10px] text-slate-500 block mb-1">Series</label>
                                                                <input
                                                                    type="number"
                                                                    value={ex.sets}
                                                                    onChange={(e) => updateExercise(selectedDay, ex.tempId, 'sets', e.target.value)}
                                                                    className="w-full bg-slate-950 border border-white/5 rounded-lg p-2 text-sm text-center"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] text-slate-500 block mb-1">Reps</label>
                                                                <input
                                                                    type="text"
                                                                    value={ex.reps}
                                                                    onChange={(e) => updateExercise(selectedDay, ex.tempId, 'reps', e.target.value)}
                                                                    className="w-full bg-slate-950 border border-white/5 rounded-lg p-2 text-sm text-center"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] text-slate-500 block mb-1">Peso</label>
                                                                <input
                                                                    type="text"
                                                                    value={ex.weight}
                                                                    placeholder="--"
                                                                    onChange={(e) => updateExercise(selectedDay, ex.tempId, 'weight', e.target.value)}
                                                                    className="w-full bg-slate-950 border border-white/5 rounded-lg p-2 text-sm text-center"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] text-slate-500 block mb-1">Técnica</label>
                                                                <select
                                                                    value={ex.technique || 'normal'}
                                                                    onChange={(e) => handleTechniqueChange(selectedDay, ex.tempId, e.target.value)}
                                                                    className="w-full bg-slate-950 border border-white/5 rounded-lg p-2 text-[11px] text-center appearance-none cursor-pointer"
                                                                >
                                                                    {TRAINING_TECHNIQUES.map(tech => (
                                                                        <option key={tech.id} value={tech.id}>
                                                                            {tech.icon} {tech.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        {/* Technique Badge */}
                                                        {ex.technique && ex.technique !== 'normal' && (
                                                            <div className="mt-2">
                                                                <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20 font-bold">
                                                                    {TRAINING_TECHNIQUES.find(t => t.id === ex.technique)?.icon} {TRAINING_TECHNIQUES.find(t => t.id === ex.technique)?.label}
                                                                    {ex.technique === 'superset' && ex.pairedWith && (
                                                                        <span className="text-green-400"> + {ex.pairedWith}</span>
                                                                    )}
                                                                    {ex.technique !== 'superset' && (
                                                                        <span className="text-slate-400">: {TRAINING_TECHNIQUES.find(t => t.id === ex.technique)?.description}</span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Reorder.Item>
                                        ))}
                                    </Reorder.Group>
                                )}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-4">
                            <button onClick={() => setStep(1)} className="bg-slate-900 p-4 rounded-2xl border border-white/5">
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                disabled={totalExercises === 0}
                                onClick={() => setStep(3)}
                                className="flex-1 bg-white text-slate-950 py-4 rounded-2xl font-black flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                Revisar ({totalExercises} ejercicios) <ChevronRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: Review */}
                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="glass p-8 rounded-[32px] border border-white/5">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black mb-2">{routineName}</h2>
                                <p className="text-slate-400">{activeDays.length} días • {totalExercises} ejercicios</p>
                            </div>

                            <div className="space-y-4">
                                {activeDays.map(day => (
                                    <div key={day} className="bg-slate-900/50 p-4 rounded-2xl">
                                        <h4 className="font-bold text-blue-400 mb-2">{day}</h4>
                                        <div className="space-y-1">
                                            {routineDays[day].map((ex, i) => (
                                                <div key={ex.tempId} className="flex justify-between text-sm">
                                                    <span className="text-slate-300">{i + 1}. {ex.name}</span>
                                                    <span className="text-slate-500">{ex.sets}x{ex.reps} {ex.weight && `@ ${ex.weight}kg`}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep(2)} className="bg-slate-900 p-4 rounded-2xl border border-white/5">
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-black flex items-center justify-center gap-2"
                            >
                                <Save size={20} /> Guardar Rutina
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Superset Pairing Modal */}
            {supersetPairing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 rounded-[32px] border border-white/10 max-w-md w-full p-6"
                    >
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🔗</span>
                            </div>
                            <h3 className="text-xl font-black">Crear Superserie</h3>
                            <p className="text-slate-400 text-sm mt-1">
                                Seleccioná con qué ejercicio combinar <span className="text-orange-400 font-bold">{supersetPairing.exerciseName}</span>
                            </p>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {/* All exercises from CATALOG of the same muscle group */}
                            {EXERCISES
                                .filter(ex => ex.muscleGroup === supersetPairing.muscleGroup && ex.name !== supersetPairing.exerciseName)
                                .map(ex => (
                                    <button
                                        key={ex.id}
                                        onClick={() => handlePairExercise(ex)}
                                        className="w-full bg-slate-800 hover:bg-green-900/40 p-4 rounded-xl text-left transition-colors flex items-center justify-between hover:border-green-500/30 border border-transparent"
                                    >
                                        <div>
                                            <div className="font-bold text-sm">{ex.name}</div>
                                            <div className="text-[10px] text-slate-500">
                                                {ex.equipment} • {ex.level}
                                            </div>
                                        </div>
                                        <Plus size={18} className="text-green-400" />
                                    </button>
                                ))}

                            {EXERCISES.filter(ex => ex.muscleGroup === supersetPairing.muscleGroup && ex.name !== supersetPairing.exerciseName).length === 0 && (
                                <div className="text-center py-8 text-slate-500">
                                    <p className="text-sm">No hay otros ejercicios de este músculo.</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setSupersetPairing(null)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-sm"
                            >
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
