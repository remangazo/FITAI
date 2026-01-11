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

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, User, Dumbbell, Scale, Calendar,
    TrendingUp, Target, Clock, Flame, Award, Send, Loader2,
    CheckCircle2, AlertCircle, Plus, FileText, Crown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { trainerService } from '../services/trainerService';
import { BackButton } from '../components/Navigation';
import { analyzeRoutineFromImage } from '../services/geminiService';
import { Camera, Sparkles, Wand2 } from 'lucide-react';

export default function StudentProgress({ isDemo = false }) {
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
        if (isDemo) {
            setStudentData({
                student: {
                    displayName: 'Juan Pérez',
                    goal: 'Hipertrofia Muscular',
                    experience: 'Avanzado',
                    weight: 82.5,
                    height: 180,
                    age: 28,
                    metabolism: 'Rápido',
                    isPremium: true,
                    daysPerWeek: 5,
                    weightHistory: [
                        { date: '2023-10-01', weight: 85.0 },
                        { date: '2023-10-15', weight: 84.2 },
                        { date: '2023-11-01', weight: 83.5 },
                        { date: '2023-11-15', weight: 83.0 },
                        { date: '2023-12-01', weight: 82.5 }
                    ]
                },
                stats: {
                    totalWorkouts: 18,
                    attendanceRate: 92
                },
                workouts: [
                    { routineName: 'Empuje (Pecho/Tríceps)', completedAt: { toDate: () => new Date() } },
                    { routineName: 'Tracción (Espalda/Bíceps)', completedAt: { toDate: () => new Date(Date.now() - 86400000) } },
                    { routineName: 'Piernas (Cuádriceps)', completedAt: { toDate: () => new Date(Date.now() - 2 * 86400000) } }
                ],
                routines: [],
                assignedRoutines: [
                    { id: 'ar-1', routine: { name: 'Plan Elite Vol. 1' }, status: 'active', notes: 'Enfocate en la fase excéntrica', assignedAt: { toDate: () => new Date() } }
                ]
            });
            setLoading(false);
            return;
        }

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
                {/* Header */}
                <div className="flex items-center gap-4 mb-10 overflow-hidden">
                    <div className="relative">
                        <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20 overflow-hidden">
                            {student.photoURL ? (
                                <img src={student.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-['Outfit'] font-black text-brand-primary">
                                    {student.displayName?.charAt(0)}
                                </span>
                            )}
                        </div>
                        {student.isPremium && (
                            <div className="absolute -top-2 -right-2 bg-amber-400 p-1 rounded-lg border-2 border-slate-950 shadow-lg">
                                <Crown size={12} className="text-slate-900" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-['Outfit'] font-black tracking-tight text-white leading-tight">
                            {student.displayName}
                        </h1>
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {student.goal}
                            </span>
                            <span>•</span>
                            <span>{student.experience}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                    <QuickStat label="Entrenos (30d)" value={studentData.stats.totalWorkouts} icon={Dumbbell} color="text-blue-400" />
                    <QuickStat label="Asistencia" value={`${studentData.stats.attendanceRate}%`} icon={Award} color="text-emerald-400" />
                    <QuickStat label="Peso actual (kg)" value={student.weight || '--'} icon={Scale} color="text-violet-400" />
                </div>
                <div className="bg-slate-900 rounded-2xl p-4 text-center border border-white/5">
                    <Scale className="mx-auto mb-2 text-purple-400" size={20} />
                    <div className="text-2xl font-black">{student.weight || '--'}</div>
                    <div className="text-xs text-slate-400">Peso actual (kg)</div>
                </div>

                {/* Weight Chart */}
                {chartData.length > 1 && (
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-white/5 relative overflow-hidden group mb-10 shadow-xl shadow-black/40">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] rounded-full"></div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                    <TrendingUp className="text-blue-400" size={20} />
                                </div>
                                <span className="font-['Outfit'] font-black uppercase tracking-[0.2em] text-xs text-slate-400">Evolución de Peso</span>
                            </div>
                            <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Últimos 10 registros</div>
                        </div>
                        <div className="h-64 relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={15}
                                    />
                                    <YAxis
                                        domain={['dataMin - 1', 'dataMax + 1']}
                                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={35}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#0f172a',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 16,
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                                            fontSize: '12px',
                                            fontWeight: '900',
                                            padding: '12px'
                                        }}
                                        cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="peso"
                                        stroke="#3b82f6"
                                        strokeWidth={5}
                                        dot={{ fill: '#3b82f6', strokeWidth: 3, r: 5, stroke: '#0f172a' }}
                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                        animationDuration={2000}
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
                            key="resumen"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-8"
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
                            <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group shadow-xl shadow-black/30">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-primary to-brand-violet"></div>
                                <h3 className="font-['Outfit'] font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                        <User size={14} className="text-blue-400" />
                                    </div>
                                    Perfil del Atleta
                                </h3>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                                    <InfoRow label="Objetivo" value={student.goal || '--'} icon={Target} />
                                    <InfoRow label="Frecuencia" value={`${student.daysPerWeek || '--'} días/sem`} icon={Calendar} />
                                    <InfoRow label="Nivel" value={student.experience || '--'} icon={Award} />
                                    <InfoRow label="Metabolismo" value={student.metabolism || 'Estándar'} icon={Flame} />
                                    <InfoRow label="Altura" value={student.height ? `${student.height} cm` : '--'} icon={Scale} />
                                    <InfoRow label="Status" value={student.isPremium ? 'Elite Premium' : 'Atleta Free'} icon={Crown} premium={student.isPremium} />
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
function InfoRow({ label, value, icon: Icon, premium }) {
    return (
        <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${premium ? 'bg-amber-400/10 text-amber-400' : 'bg-slate-800/50 text-slate-500'}`}>
                {Icon && <Icon size={16} />}
            </div>
            <div>
                <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest leading-none mb-1">{label}</div>
                <div className={`font-bold text-sm ${premium ? 'text-amber-400' : 'text-white'}`}>{value}</div>
            </div>
        </div>
    );
}

// Simplified Assign Routine Modal
function AssignRoutineModal({ onClose, onAssign }) {
    const [name, setName] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef(null);

    const handleScanRoutine = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        try {
            // Convert file to base64
            const reader = new FileReader();
            const base64Promise = new Promise((resolve) => {
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
            const base64Image = await base64Promise;

            // Call Gemini
            const aiData = await analyzeRoutineFromImage(base64Image);

            if (aiData) {
                setName(aiData.title || '');
                // Formatear ejercicios en las notas para que el coach los revise
                let exercisesText = "";
                if (aiData.exercises && aiData.exercises.length > 0) {
                    exercisesText = "\n\nEJERCICIOS DETECTADOS:\n" +
                        aiData.exercises.map(ex => `- ${ex.name}: ${ex.sets}x${ex.reps} (${ex.notes || ''})`).join('\n');
                }
                setNotes((aiData.notes || '') + exercisesText);
            }
        } catch (error) {
            console.error("Error scanning routine:", error);
            alert("No pudimos leer la imagen. Intenta con una foto más clara.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const routineData = {
                name: name.trim(),
                createdAt: new Date(),
                days: [], // Aquí se podrían mapear los días si la IA los devolviera estructurados
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
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black">Asignar Rutina</h3>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleScanRoutine}
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanning}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-brand-primary/20 to-brand-violet/20 border border-brand-primary/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary-light hover:from-brand-primary/30 hover:to-brand-violet/30 transition-all disabled:opacity-50"
                    >
                        {isScanning ? (
                            <Wand2 className="animate-pulse" size={14} />
                        ) : (
                            <Camera size={14} />
                        )}
                        {isScanning ? 'Escaneando...' : 'Escanear IA'}
                    </motion.button>
                </div>

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

// Quick Stat Box Component
function QuickStat({ label, value, icon: Icon, color }) {
    return (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-5 border border-white/5 text-center shadow-lg shadow-black/20 group hover:border-white/10 transition-colors">
            <div className={`p-2 bg-slate-800/50 rounded-xl w-fit mx-auto mb-3 border border-white/5 ${color || 'text-slate-400'}`}>
                {Icon && <Icon size={16} />}
            </div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 leading-none">{label}</div>
            <div className="text-xl font-['Outfit'] font-black text-white">{value}</div>
        </div>
    );
}
