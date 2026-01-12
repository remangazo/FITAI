import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Save, Zap, Edit2, ChevronDown, ChevronUp, Trash2, Plus, PencilLine, Check, Settings, Info, Download, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { exportRoutineToPDF } from '../services/pdfExportService';
import ExerciseCatalog from './ExerciseCatalog';

const RoutineModal = ({ routine, onSave, onSaveAndActivate, onClose, isNew = true }) => {
    const [expandedDays, setExpandedDays] = useState([0]);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedRoutine, setEditedRoutine] = useState(routine);
    const [editingExercise, setEditingExercise] = useState(null);
    const [showExercisePicker, setShowExercisePicker] = useState(false);
    const [selectedDayForAdd, setSelectedDayForAdd] = useState(null);
    const { profile } = useAuth(); // for PDF personalization

    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const navigate = useNavigate();

    const activeRoutine = isEditing ? editedRoutine : routine;

    const handleExportPDF = () => {
        if (!profile?.isPremium) {
            setShowPremiumModal(true);
            return;
        }
        exportRoutineToPDF(activeRoutine, profile);
    };

    const toggleDayExpansion = (index) => {
        setExpandedDays(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleRemoveExercise = (dayIndex, exerciseIndex) => {
        if (!confirm('¿Eliminar este ejercicio?')) return;
        const newRoutine = JSON.parse(JSON.stringify(editedRoutine));
        newRoutine.days[dayIndex].exercises.splice(exerciseIndex, 1);
        setEditedRoutine(newRoutine);
    };

    const handleEditExercise = (dayIndex, exerciseIndex) => {
        setEditingExercise({ dayIndex, exerciseIndex });
    };

    const handleUpdateExercise = (dayIndex, exerciseIndex, updates) => {
        const newRoutine = JSON.parse(JSON.stringify(editedRoutine));
        newRoutine.days[dayIndex].exercises[exerciseIndex] = {
            ...newRoutine.days[dayIndex].exercises[exerciseIndex],
            ...updates
        };
        setEditedRoutine(newRoutine);
        setEditingExercise(null);
    };

    const handleAddExerciseClick = (dayIndex) => {
        setSelectedDayForAdd(dayIndex);
        setShowExercisePicker(true);
    };

    const handleExerciseSelected = (exercise) => {
        if (selectedDayForAdd === null) return;
        const newRoutine = JSON.parse(JSON.stringify(editedRoutine));
        newRoutine.days[selectedDayForAdd].exercises.push({
            name: exercise.name,
            sets: 4,
            reps: "8-12",
            rest: "90s",
            notes: "",
            muscleGroup: exercise.muscleGroup || exercise.target
        });
        setEditedRoutine(newRoutine);
        setShowExercisePicker(false);
        setSelectedDayForAdd(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(activeRoutine);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAndActivate = async () => {
        setIsSaving(true);
        try {
            await onSaveAndActivate(activeRoutine);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900 rounded-[32px] border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-bold text-white">{activeRoutine?.title || 'Rutina Generada'}</h2>
                                    {isEditing && (
                                        <span className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-bold">
                                            EDITANDO
                                        </span>
                                    )}
                                </div>
                                <p className="text-slate-400 text-sm">{activeRoutine?.description || ''}</p>
                                <div className="flex flex-wrap gap-3 mt-3">
                                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-lg border border-blue-500/20">
                                        {activeRoutine?.daysPerWeek || '?'} dias/semana
                                    </span>
                                    <span className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">
                                        {activeRoutine?.estimatedDuration || '45-60 min'}
                                    </span>
                                    {isNew && !isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-4 py-1 rounded-full font-bold transition-colors flex items-center gap-1"
                                        >
                                            <Edit2 size={12} />
                                            Personalizar
                                        </button>
                                    )}
                                    <button
                                        onClick={handleExportPDF}
                                        className={`text-[10px] px-3 py-0.5 rounded-lg font-bold transition-colors flex items-center gap-1 ${profile?.isPremium
                                            ? "bg-slate-700 hover:bg-slate-600 text-white border border-white/5"
                                            : "bg-slate-800 text-slate-500 hover:text-white border border-white/5"
                                            }`}
                                        title="Descargar PDF (Premium)"
                                    >
                                        {profile?.isPremium ? <Download size={10} /> : <div className="bg-amber-500 p-0.5 rounded-sm mr-0.5"><Zap size={8} className="text-black fill-black" /></div>}
                                        PDF
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        {activeRoutine?.isAssignedByCoach && activeRoutine?.notes && (
                            <div className="mt-4 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <MessageSquare size={12} /> Notas de tu Coach
                                </h4>
                                <p className="text-sm text-slate-300 italic whitespace-pre-wrap leading-relaxed">
                                    {activeRoutine.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {activeRoutine?.days && activeRoutine.days.length > 0 ? (
                            activeRoutine.days.map((day, dayIndex) => (
                                <div key={dayIndex} className="glass rounded-2xl border border-white/5 overflow-hidden">
                                    <button
                                        onClick={() => toggleDayExpansion(dayIndex)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-white"
                                    >
                                        <div className="text-left">
                                            <h3 className="font-bold text-lg">{day.day}</h3>
                                            <p className="text-sm text-slate-400">{day.focus}</p>
                                        </div>
                                        {expandedDays.includes(dayIndex) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>

                                    <AnimatePresence>
                                        {expandedDays.includes(dayIndex) && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-white/5"
                                            >
                                                <div className="p-4 space-y-4">
                                                    {day.warmup && (
                                                        <div className="text-sm">
                                                            <div className="text-orange-400 font-bold mb-1 flex items-center gap-1">🔥 Calentamiento</div>
                                                            <p className="text-slate-400">{day.warmup}</p>
                                                        </div>
                                                    )}

                                                    <div className="space-y-2">
                                                        {day.exercises?.map((exercise, exIndex) => (
                                                            <ExerciseCard
                                                                key={exIndex}
                                                                exercise={exercise}
                                                                isEditing={isEditing}
                                                                onEdit={() => handleEditExercise(dayIndex, exIndex)}
                                                                onRemove={() => handleRemoveExercise(dayIndex, exIndex)}
                                                                editingThis={editingExercise?.dayIndex === dayIndex && editingExercise?.exerciseIndex === exIndex}
                                                                onSave={(updates) => handleUpdateExercise(dayIndex, exIndex, updates)}
                                                                onCancelEdit={() => setEditingExercise(null)}
                                                            />
                                                        ))}

                                                        {isEditing && (
                                                            <button
                                                                onClick={() => handleAddExerciseClick(dayIndex)}
                                                                className="w-full bg-blue-600/10 hover:bg-blue-600/20 border-2 border-dashed border-blue-600/30 py-4 rounded-xl font-bold text-blue-400 flex items-center justify-center gap-2 transition-colors"
                                                            >
                                                                <Plus size={20} />
                                                                Agregar Ejercicio
                                                            </button>
                                                        )}
                                                    </div>

                                                    {day.cardio && (
                                                        <div className="text-sm bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                                                            <div className="text-amber-500 font-bold mb-1 flex items-center gap-1">🏃 Cardio Recomendado</div>
                                                            <p className="text-slate-300 italic">{day.cardio}</p>
                                                        </div>
                                                    )}

                                                    {day.stretching && (
                                                        <div className="text-sm">
                                                            <div className="text-green-400 font-bold mb-1 flex items-center gap-1">🧘 Estiramiento</div>
                                                            <p className="text-slate-400">{day.stretching}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <p>Cargando rutina...</p>
                            </div>
                        )}
                    </div>

                    <div className="px-6 pt-4 pb-10 border-t border-white/5 bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center gap-4">
                        {isNew ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-3.5 rounded-2xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group"
                                >
                                    <Save size={18} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-black uppercase tracking-widest">Borrador</span>
                                </button>
                                <button
                                    onClick={handleSaveAndActivate}
                                    disabled={isSaving}
                                    className="flex-[1.5] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Zap size={18} className="fill-current animate-pulse" />
                                    <span className="text-xs font-black uppercase tracking-widest text-center">Activar Plan</span>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className="w-full bg-slate-800 hover:bg-slate-700 py-3.5 rounded-2xl font-black text-sm transition-colors text-white uppercase tracking-widest"
                            >
                                Cerrar
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Pro Feature Locked Modal for PDF Export */}
            <AnimatePresence>
                {showPremiumModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
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
                                    <Download size={32} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Acceso Elite</h3>
                            </div>
                            <div className="p-6 text-center space-y-6">
                                <p className="text-slate-300">
                                    Exportar a <strong>PDF</strong> para entrenar sin distracciones es una ventaja Elite.
                                </p>
                                <button
                                    onClick={() => navigate('/premium')}
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

            {/* Exercise Picker Modal */}
            {showExercisePicker && (
                <ExercisePickerModal
                    onSelect={handleExerciseSelected}
                    onClose={() => {
                        setShowExercisePicker(false);
                        setSelectedDayForAdd(null);
                    }}
                />
            )}
        </>
    );
};

// Exercise Card Component
const TRAINING_TECHNIQUES = [
    { id: 'normal', label: 'Normal', icon: '', description: 'Serie estándar' },
    { id: 'superset', label: 'Superserie', icon: '🔗', description: 'Sin descanso con otro ejercicio' },
    { id: 'dropset', label: 'Drop Set', icon: '⬇️', description: 'Reducir peso sin descanso' },
    { id: 'restpause', label: 'Rest-Pause', icon: '⏸️', description: 'Pausas breves de 10-15s' },
    { id: 'pyramid', label: 'Piramidal', icon: '📈', description: 'Aumentar/disminuir peso' },
    { id: 'cluster', label: 'Cluster Set', icon: '🔷', description: 'Micro-pausas entre reps' },
];

const ExerciseCard = ({ exercise, isEditing, onEdit, onRemove, editingThis, onSave, onCancelEdit }) => {
    const [editValues, setEditValues] = useState({
        sets: exercise.sets,
        reps: exercise.reps,
        rest: exercise.rest,
        notes: exercise.notes || "",
        technique: exercise.technique || "normal"
    });

    const currentTechnique = TRAINING_TECHNIQUES.find(t => t.id === (exercise.technique || 'normal'));

    if (editingThis) {
        return (
            <div className="bg-slate-800/50 p-4 rounded-xl border-2 border-blue-500/50">
                <h4 className="font-bold text-sm mb-3 text-white">{exercise.name}</h4>
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Sets</label>
                        <input
                            type="number"
                            value={editValues.sets}
                            onChange={e => setEditValues({ ...editValues, sets: parseInt(e.target.value) })}
                            className="w-full bg-slate-700 px-2 py-1 rounded text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Reps</label>
                        <input
                            type="text"
                            value={editValues.reps}
                            onChange={e => setEditValues({ ...editValues, reps: e.target.value })}
                            className="w-full bg-slate-700 px-2 py-1 rounded text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Descanso</label>
                        <input
                            type="text"
                            value={editValues.rest}
                            onChange={e => setEditValues({ ...editValues, rest: e.target.value })}
                            className="w-full bg-slate-700 px-2 py-1 rounded text-sm text-white"
                        />
                    </div>
                </div>

                {/* Technique Selector */}
                <div className="mb-3">
                    <label className="text-xs text-slate-400 block mb-1">Técnica Avanzada</label>
                    <select
                        value={editValues.technique}
                        onChange={e => setEditValues({ ...editValues, technique: e.target.value })}
                        className="w-full bg-slate-700 px-2 py-2 rounded text-sm text-white border border-white/10"
                    >
                        {TRAINING_TECHNIQUES.map(tech => (
                            <option key={tech.id} value={tech.id}>
                                {tech.icon} {tech.label} - {tech.description}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="text-xs text-slate-400 block mb-1">Notas</label>
                    <textarea
                        value={editValues.notes}
                        onChange={e => setEditValues({ ...editValues, notes: e.target.value })}
                        className="w-full bg-slate-700 px-2 py-1 rounded text-sm text-white"
                        rows={2}
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onSave(editValues)}
                        className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-1 text-white"
                    >
                        <Check size={14} />
                        Guardar
                    </button>
                    <button
                        onClick={onCancelEdit}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-xl font-bold text-sm text-white"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm text-white">{exercise.name}</h4>
                        {exercise.machineName && (
                            <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Settings size={10} /> {exercise.machineName}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {exercise.muscleGroup && (
                            <span className="text-xs text-blue-400 font-medium">{exercise.muscleGroup}</span>
                        )}
                        {exercise.variation && (
                            <span className="text-[10px] text-purple-400 flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                                <Info size={10} /> {exercise.variation}
                            </span>
                        )}
                        {currentTechnique && currentTechnique.id !== 'normal' && (
                            <span className="text-[10px] text-orange-400 flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20 font-bold">
                                {currentTechnique.icon} {currentTechnique.label}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-sm font-black text-white">{exercise.sets} x {exercise.reps}</div>
                        {exercise.rest && <div className="text-[10px] text-slate-500 font-medium">Desc: {exercise.rest}</div>}
                    </div>
                    {isEditing && (
                        <div className="flex gap-1">
                            <button
                                onClick={onEdit}
                                className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                            >
                                <PencilLine size={14} />
                            </button>
                            <button
                                onClick={onRemove}
                                className="p-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {exercise.notes && (
                <div className="text-[11px] text-slate-400 mt-2 bg-slate-900/50 p-2 rounded-lg border border-white/5">
                    <span className="text-blue-400 mr-1 italic">Nota Técnica:</span> {exercise.notes}
                </div>
            )}
        </div>
    );
};

// Exercise Picker Modal
const ExercisePickerModal = ({ onSelect, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 rounded-[32px] border border-white/10 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">Selecciona un Ejercicio</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ExerciseCatalog
                        onExerciseSelect={(exercise) => {
                            onSelect(exercise);
                        }}
                        selectMode={true}
                    />
                </div>
            </motion.div>
        </div>
    );
};

export default RoutineModal;
