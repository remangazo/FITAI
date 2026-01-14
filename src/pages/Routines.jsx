import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Plus, BookOpen, PenTool as Tool, ChevronRight, ChevronDown, ChevronUp, Trash2, Zap, Calendar, ChevronLeft, Info, Settings, Minimize2 } from 'lucide-react';
import ExerciseCatalog from '../components/ExerciseCatalog';
import RoutineBuilder from '../components/RoutineBuilder';
import { BottomNav, BackButton } from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { getUserRoutines, deleteRoutine, activateRoutine } from '../services/routineService';
import { getExerciseImage, getEquipmentIcon } from '../services/exerciseAssets';
import { EXERCISES } from '../data/exercises';
import RoutineModal from '../components/RoutineModal';


export default function Routines() {
    const { t } = useTranslation();
    const { user, profile, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('my-routines');
    const [aiRoutines, setAiRoutines] = useState([]);
    const [manualRoutines, setManualRoutines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRoutine, setExpandedRoutine] = useState(null);
    const [selectedManualRoutine, setSelectedManualRoutine] = useState(null);

    // Load routines on mount
    useEffect(() => {
        loadAllRoutines();
    }, [user]);

    const loadAllRoutines = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Load AI-generated routines from Firestore
            console.log('[Routines] Loading routines for user:', user.uid);
            const firestoreRoutines = await getUserRoutines(user.uid);
            console.log('[Routines] Found', firestoreRoutines.length, 'routines in Firestore');
            setAiRoutines(firestoreRoutines);

            // Load manual routines from localStorage
            const saved = JSON.parse(localStorage.getItem('fitai_manual_routines') || '[]');
            setManualRoutines(saved);
        } catch (error) {
            console.error('[Routines] Error loading routines:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveManualRoutine = async (routine) => {
        const updatedRoutines = [routine, ...manualRoutines];
        setManualRoutines(updatedRoutines);

        // Save to localStorage
        localStorage.setItem('fitai_manual_routines', JSON.stringify(updatedRoutines));
        if (updateProfile) {
            await updateProfile({ manualRoutines: updatedRoutines });
        }

        setActiveTab('my-routines');
    };

    const handleDeleteAiRoutine = async (routineId) => {
        if (!confirm('¿Eliminar esta rutina?')) return;

        try {
            await deleteRoutine(routineId);
            setAiRoutines(prev => prev.filter(r => r.id !== routineId));
        } catch (error) {
            console.error('[Routines] Error deleting routine:', error);
            alert('Error al eliminar rutina');
        }
    };

    const handleActivateRoutine = async (routineId) => {
        try {
            await activateRoutine(routineId, user.uid);
            // Refresh routines to update active status
            await loadAllRoutines();
            alert('✅ Rutina activada!');
        } catch (error) {
            console.error('[Routines] Error activating routine:', error);
            alert('Error al activar rutina');
        }
    };

    const deleteManualRoutine = (index) => {
        const updated = manualRoutines.filter((_, i) => i !== index);
        setManualRoutines(updated);
        localStorage.setItem('fitai_manual_routines', JSON.stringify(updated));
    };

    // Combined routines for display
    const allRoutines = [...aiRoutines, ...manualRoutines.map((r, i) => ({ ...r, isManual: true, manualIndex: i }))];

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-32 md:pb-8">
            {/* Header - Optimized for mobile */}
            <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 pt-3 sm:pt-6 pb-3 sm:pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Entrenamiento</h1>
                                <p className="text-slate-500 text-xs hidden sm:block">Tus rutinas guardadas y catálogo de ejercicios</p>
                            </div>
                        </div>
                        {activeTab !== 'builder' && (
                            <button
                                onClick={() => setActiveTab('builder')}
                                className="bg-blue-600 hover:bg-blue-500 transition-colors px-4 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold flex items-center gap-2 text-xs sm:text-sm shadow-lg shadow-blue-500/20"
                            >
                                <Plus size={16} /> <span className="hidden sm:inline">Crear</span> Rutina Manual
                            </button>
                        )}
                    </div>

                    {/* Tabs - Compact */}
                    <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
                        <TabButton
                            active={activeTab === 'my-routines'}
                            onClick={() => setActiveTab('my-routines')}
                            icon={<Dumbbell size={14} />}
                            label="Mis Rutinas"
                            count={allRoutines.length}
                        />
                        <TabButton
                            active={activeTab === 'catalog'}
                            onClick={() => setActiveTab('catalog')}
                            icon={<BookOpen size={14} />}
                            label="Catálogo"
                            count={EXERCISES.length}
                        />
                        <TabButton
                            active={activeTab === 'builder'}
                            onClick={() => setActiveTab('builder')}
                            icon={<Tool size={14} />}
                            label="Creador"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto p-4 md:p-8 pb-40">
                <AnimatePresence mode="wait">
                    {activeTab === 'my-routines' && (
                        <motion.div
                            key="my-routines"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {loading ? (
                                <div className="text-center py-20">
                                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                                    <p className="text-slate-400">Cargando rutinas...</p>
                                </div>
                            ) : allRoutines.length === 0 ? (
                                <div className="text-center py-20 glass rounded-[32px] border border-white/5">
                                    <Dumbbell className="mx-auto text-slate-700 mb-4" size={48} />
                                    <h3 className="text-xl font-bold mb-2">Aún no tienes rutinas</h3>
                                    <p className="text-slate-400 mb-6">Genera tu primera rutina con IA desde el Dashboard</p>
                                    <button
                                        onClick={() => window.location.href = '/dashboard'}
                                        className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl font-bold inline-flex items-center gap-2"
                                    >
                                        <Zap size={18} /> Ir al Dashboard
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* AI Generated Routines */}
                                    {aiRoutines.length > 0 && (
                                        <div className="mb-8">
                                            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                                                <Zap size={14} className="text-blue-400" />
                                                Rutinas Generadas con IA ({aiRoutines.length})
                                            </h3>
                                            <div className="space-y-4">
                                                {aiRoutines.map((routine) => (
                                                    <AIRoutineCard
                                                        key={routine.id}
                                                        routine={routine}
                                                        expanded={expandedRoutine === routine.id}
                                                        onToggle={() => setExpandedRoutine(expandedRoutine === routine.id ? null : routine.id)}
                                                        onDelete={() => handleDeleteAiRoutine(routine.id)}
                                                        onActivate={() => handleActivateRoutine(routine.id)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Manual Routines */}
                                    {manualRoutines.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                                                <Tool size={14} className="text-purple-400" />
                                                Rutinas Manuales ({manualRoutines.length})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {manualRoutines.map((routine, index) => (
                                                    <ManualRoutineCard
                                                        key={index}
                                                        routine={routine}
                                                        onDelete={() => deleteManualRoutine(index)}
                                                        onViewDetails={() => setSelectedManualRoutine(routine)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'catalog' && (
                        <motion.div
                            key="catalog"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <ExerciseCatalog />
                        </motion.div>
                    )}

                    {activeTab === 'builder' && (
                        <motion.div
                            key="builder"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <RoutineBuilder onSave={handleSaveManualRoutine} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <BottomNav />

            {/* Manual Routine Detail Modal */}
            {selectedManualRoutine && (
                <RoutineModal
                    routine={{
                        title: selectedManualRoutine.name,
                        description: `Rutina manual - ${selectedManualRoutine.activeDays?.length || Object.keys(selectedManualRoutine.days || {}).length} días`,
                        daysPerWeek: selectedManualRoutine.activeDays?.length || Object.keys(selectedManualRoutine.days || {}).length,
                        days: selectedManualRoutine.days
                            ? Object.entries(selectedManualRoutine.days).map(([day, exercises]) => ({
                                day: day,
                                focus: `${exercises.length} ejercicios`,
                                exercises: exercises.map(ex => ({
                                    name: ex.name,
                                    sets: ex.sets || 4,
                                    reps: ex.reps || '8-12',
                                    rest: ex.rest || '90s',
                                    muscleGroup: ex.muscleGroup || '',
                                    technique: ex.technique || 'normal'
                                }))
                            }))
                            : []
                    }}
                    onSave={() => setSelectedManualRoutine(null)}
                    onSaveAndActivate={() => setSelectedManualRoutine(null)}
                    onClose={() => setSelectedManualRoutine(null)}
                    isNew={false}
                />
            )}
        </div>
    );
}

function TabButton({ active, onClick, icon, label, count }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 pb-3 px-1 font-bold transition-all border-b-2 whitespace-nowrap text-sm ${active ? 'text-blue-400 border-blue-400' : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
        >
            {icon}
            {label}
            {count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${active ? 'bg-blue-500/20' : 'bg-slate-800'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function AIRoutineCard({ routine, expanded, onToggle, onDelete, onActivate }) {
    return (
        <div className={`glass rounded-2xl border ${routine.isActive ? 'border-green-500/30 bg-green-500/5' : 'border-white/5'} overflow-hidden`}>
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
            >
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-lg">{routine.title}</h4>
                        {routine.isActive && (
                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">
                                ACTIVA
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-400">{routine.description}</p>
                    <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                            {routine.daysPerWeek} días/semana
                        </span>
                        <span className="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded-full flex items-center gap-1">
                            <Calendar size={10} />
                            {routine.createdAt instanceof Date
                                ? routine.createdAt.toLocaleDateString()
                                : new Date(routine.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10"
                    >
                        <div className="p-4 space-y-3">
                            {routine.days?.map((day, i) => (
                                <div key={i} className="bg-slate-800/50 p-3 rounded-xl">
                                    <h5 className="font-bold text-sm mb-2">{day.day} - {day.focus}</h5>
                                    <div className="space-y-1">
                                        {day.exercises?.slice(0, 3).map((ex, j) => (
                                            <div key={j} className="text-xs text-slate-400 flex flex-col gap-1 border-l-2 border-blue-500/20 pl-2 py-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="font-bold text-slate-200">{ex.name}</span>
                                                        {ex.machineName && (
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                                <Settings size={10} /> {ex.machineName}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-black text-white text-sm bg-slate-700/50 px-2 py-0.5 rounded block">{ex.sets}×{ex.reps}</span>
                                                        {ex.rest && <div className="text-[10px] text-slate-500 italic mt-0.5">Desc: {ex.rest}</div>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    {ex.suggestedWeight && (
                                                        <span className="text-[10px] text-blue-400 font-medium bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">
                                                            🎯 {ex.suggestedWeight}
                                                        </span>
                                                    )}
                                                    {ex.variation && (
                                                        <span className="text-[10px] text-purple-400 flex items-center gap-1 bg-purple-500/5 px-1.5 py-0.5 rounded border border-purple-500/10">
                                                            <Info size={10} /> {ex.variation}
                                                        </span>
                                                    )}
                                                </div>
                                                {ex.notes && (
                                                    <p className="text-[9px] text-slate-500 italic mt-1 line-clamp-1 hover:line-clamp-none transition-all cursor-default">
                                                        "{ex.notes}"
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                        {day.exercises?.length > 3 && (
                                            <span className="text-xs text-blue-400">+{day.exercises.length - 3} más</span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="flex gap-2 pt-2">
                                {!routine.isActive && (
                                    <button
                                        onClick={onActivate}
                                        className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                    >
                                        <Zap size={14} /> Activar
                                    </button>
                                )}
                                <button
                                    onClick={onDelete}
                                    className="px-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={14} /> Eliminar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ManualRoutineCard({ routine, onDelete, onViewDetails }) {
    const totalExercises = routine.days
        ? Object.values(routine.days).flat().length
        : routine.exercises?.length || 0;

    const activeDays = routine.activeDays ||
        (routine.days ? Object.entries(routine.days).filter(([_, exs]) => exs.length > 0).map(([day]) => day) : []);

    return (
        <div className="glass p-6 rounded-3xl border border-white/5 hover:border-purple-500/20 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="font-bold text-lg mb-1">{routine.name}</h4>
                    <p className="text-xs text-slate-500">
                        {totalExercises} ejercicios • {activeDays.length} días
                    </p>
                </div>
                <button
                    onClick={onDelete}
                    className="text-slate-600 hover:text-red-400 p-2 rounded-xl hover:bg-slate-800 transition-all"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Days Preview */}
            <div className="flex gap-2 flex-wrap mb-4">
                {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((day, i) => {
                    const fullDay = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][i];
                    const isActive = activeDays.includes(fullDay);
                    return (
                        <span
                            key={day}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-600'
                                }`}
                        >
                            {day.charAt(0)}
                        </span>
                    );
                })}
            </div>

            <button
                onClick={onViewDetails}
                className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
                Ver Detalles <ChevronRight size={16} />
            </button>
        </div>
    );
}
