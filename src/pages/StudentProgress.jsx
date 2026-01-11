/**
 * StudentProgress - Detailed view of a student's progress
 * 
 * Shows:
 * - Weight evolution chart
 * - Workout calendar
 * - Current routine
 * - Assigned routines by trainer
 * - Trainer notes
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, User, Dumbbell, Scale, Calendar,
    TrendingUp, Target, Clock, Flame, Award, Send, Loader2,
    CheckCircle2, AlertCircle, Plus, FileText
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { trainerService } from '../services/trainerService';
import { BackButton } from '../components/Navigation';

export default function StudentProgress() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview | routines | assign
    const [showAssignModal, setShowAssignModal] = useState(false);

    useEffect(() => {
        loadStudentData();
    }, [studentId, user]);

    const loadStudentData = async () => {
        if (!user || !studentId) return;

        setLoading(true);
        try {
            const data = await trainerService.getStudentDetails(user.uid, studentId);
            setStudentData(data);
        } catch (error) {
            console.error('Error loading student data:', error);
            alert('Error: ' + error.message);
            navigate('/trainer');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
                    <p>No se pudo cargar la informaciÃ³n del alumno</p>
                </div>
            </div>
        );
    }

    const { student, routines, workouts, assignedRoutines, stats } = studentData;
    const weightHistory = student.weightHistory || [];
    const chartData = weightHistory.slice(-10).map(w => ({
        date: new Date(w.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
        peso: w.weight
    }));

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-8">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-lg border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <BackButton />
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-lg font-black">
                            {(student.displayName || student.name || 'U')[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-lg font-black">{student.displayName || student.name || 'Alumno'}</h1>
                            <p className="text-xs text-slate-400">
                                {student.goal || 'Sin objetivo definido'} â€¢ {student.experience || 'Principiante'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900 rounded-2xl p-4 text-center border border-white/5">
                        <Dumbbell className="mx-auto mb-2 text-blue-400" size={20} />
                        <div className="text-2xl font-black">{stats.totalWorkouts}</div>
                        <div className="text-xs text-slate-400">Entrenos (30d)</div>
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-4 text-center border border-white/5">
                        <Target className="mx-auto mb-2 text-green-400" size={20} />
                        <div className="text-2xl font-black">{stats.attendanceRate}%</div>
                        <div className="text-xs text-slate-400">Asistencia</div>
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-4 text-center border border-white/5">
                        <Scale className="mx-auto mb-2 text-purple-400" size={20} />
                        <div className="text-2xl font-black">{student.weight || '--'}</div>
                        <div className="text-xs text-slate-400">Peso actual (kg)</div>
                    </div>
                </div>

                {/* Weight Chart */}
                {chartData.length > 1 && (
                    <div className="bg-slate-900 rounded-2xl p-5 border border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="text-blue-400" size={18} />
                                <span className="font-bold">EvoluciÃ³n de Peso</span>
                            </div>
                        </div>
                        <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        domain={['dataMin - 1', 'dataMax + 1']}
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={30}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#1e293b',
                                            border: 'none',
                                            borderRadius: 8,
                                            color: 'white'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="peso"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6', strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 bg-slate-900 p-1 rounded-xl">
                    {[
                        { id: 'overview', label: 'Resumen', icon: Calendar },
                        { id: 'routines', label: 'Rutinas', icon: FileText },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {/* Recent Workouts */}
                            <div className="bg-slate-900 rounded-2xl p-5 border border-white/5">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <Dumbbell size={16} className="text-blue-400" />
                                    Ãšltimos Entrenos
                                </h3>
                                {workouts.length === 0 ? (
                                    <p className="text-slate-500 text-sm">Sin entrenos registrados</p>
                                ) : (
                                    <div className="space-y-3">
                                        {workouts.slice(0, 5).map((workout, i) => (
                                            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                                <div>
                                                    <div className="font-medium text-sm">{workout.routineName || 'Entrenamiento'}</div>
                                                    <div className="text-xs text-slate-400">
                                                        {workout.completedAt?.toDate?.().toLocaleDateString('es-AR') || 'Fecha desconocida'}
                                                    </div>
                                                </div>
                                                <CheckCircle2 className="text-green-400" size={18} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Student Info */}
                            <div className="bg-slate-900 rounded-2xl p-5 border border-white/5">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <User size={16} className="text-blue-400" />
                                    InformaciÃ³n del Alumno
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <InfoRow label="Objetivo" value={student.goal || '--'} />
                                    <InfoRow label="Experiencia" value={student.experience || '--'} />
                                    <InfoRow label="DÃ­as/semana" value={student.daysPerWeek || '--'} />
                                    <InfoRow label="Edad" value={student.age ? `${student.age} aÃ±os` : '--'} />
                                    <InfoRow label="Altura" value={student.height ? `${student.height} cm` : '--'} />
                                    <InfoRow label="Premium" value={student.isPremium ? 'âœ… SÃ­' : 'âŒ No'} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'routines' && (
                        <motion.div
                            key="routines"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {/* Assign Button */}
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl font-bold flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Asignar Nueva Rutina
                            </button>

                            {/* Assigned Routines */}
                            <div className="bg-slate-900 rounded-2xl p-5 border border-white/5">
                                <h3 className="font-bold mb-4">Rutinas Asignadas por Vos</h3>
                                {assignedRoutines.length === 0 ? (
                                    <p className="text-slate-500 text-sm">No le asignaste ninguna rutina todavÃ­a</p>
                                ) : (
                                    <div className="space-y-3">
                                        {assignedRoutines.map((ar) => (
                                            <div key={ar.id} className="bg-slate-800 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold">{ar.routine?.name || 'Rutina'}</span>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${ar.status === 'active'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-slate-700 text-slate-400'
                                                        }`}>
                                                        {ar.status === 'active' ? 'Activa' : 'Reemplazada'}
                                                    </span>
                                                </div>
                                                {ar.notes && (
                                                    <p className="text-xs text-slate-400 italic">"{ar.notes}"</p>
                                                )}
                                                <p className="text-xs text-slate-500 mt-2">
                                                    Asignada: {ar.assignedAt?.toDate?.().toLocaleDateString('es-AR')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Student's Own Routines */}
                            <div className="bg-slate-900 rounded-2xl p-5 border border-white/5">
                                <h3 className="font-bold mb-4">Rutinas Propias del Alumno</h3>
                                {routines.length === 0 ? (
                                    <p className="text-slate-500 text-sm">El alumno no tiene rutinas propias</p>
                                ) : (
                                    <div className="space-y-3">
                                        {routines.map((routine) => (
                                            <div key={routine.id} className="bg-slate-800 rounded-xl p-4">
                                                <span className="font-bold">{routine.name || 'Rutina'}</span>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {routine.days?.length || 0} dÃ­as â€¢ {routine.goal || 'Sin objetivo'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Assign Modal (simplified for now) */}
            <AnimatePresence>
                {showAssignModal && (
                    <AssignRoutineModal
                        onClose={() => setShowAssignModal(false)}
                        onAssign={async (routineData, notes) => {
                            try {
                                await trainerService.assignRoutineToStudent(user.uid, studentId, routineData, notes);
                                setShowAssignModal(false);
                                loadStudentData();
                            } catch (error) {
                                alert('Error: ' + error.message);
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Info Row Component
function InfoRow({ label, value }) {
    return (
        <div>
            <div className="text-slate-500 text-xs">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    );
}

// Simplified Assign Routine Modal
function AssignRoutineModal({ onClose, onAssign }) {
    const [name, setName] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            // Simplified: just create a basic routine structure
            const routineData = {
                name: name.trim(),
                createdAt: new Date(),
                days: [],
            };
            await onAssign(routineData, notes);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/10"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-xl font-black mb-4">Asignar Rutina</h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Nombre de la Rutina</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Rutina de Hipertrofia"
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Notas para el alumno (opcional)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Instrucciones o comentarios..."
                            rows={3}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-slate-800 rounded-xl font-bold"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim() || isLoading}
                        className="flex-1 py-3 bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                        Asignar
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
