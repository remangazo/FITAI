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
    CheckCircle2, AlertCircle, Plus, FileText, Crown, Ruler, MapPin, History, Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { trainerService } from '../services/trainerService';
import { BackButton } from '../components/Navigation';
import { analyzeRoutineFromImage } from '../services/geminiService';
import { Camera, Sparkles, Wand2, BarChart2 } from 'lucide-react';
import StudentAnalytics from '../components/StudentAnalytics';

export default function StudentProgress({ isDemo = false }) {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview | routines | analytics | assign
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [showDemo, setShowDemo] = useState(false);
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

        // Load analytics in parallel or deferred
        loadAnalytics();
    };

    const loadAnalytics = async () => {
        if (isDemo || !studentId) return;
        setLoadingAnalytics(true);
        try {
            const data = await trainerService.getStudentAnalytics(studentId);
            setAnalyticsData(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoadingAnalytics(false);
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
                    <p>No se pudo cargar la información del alumno</p>
                </div>
            </div>
        );
    }

    const { student, routines, workouts, assignedRoutines, stats } = studentData;

    const getGoalLabel = (goal) => {
        const goalMap = {
            'fat': 'Pérdida de Grasa',
            'muscle': 'Ganancia Muscular',
            'strength': 'Fuerza',
            'performance': 'Rendimiento',
            'balanced': 'Equilibrio / Salud'
        };
        const target = Array.isArray(goal) ? goal[0] : goal;
        return goalMap[target] || target || 'Sin objetivo';
    };

    const goalLabel = getGoalLabel(student.primaryGoal || student.goal);
    const weightHistory = student.weightHistory || [];
    const chartData = weightHistory.slice(-10).map(w => ({
        date: new Date(w.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
        peso: w.weight
    }));

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-32">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-lg border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 py-3 md:py-4">
                    <div className="flex items-center justify-between">
                        <BackButton />
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10 overflow-hidden">
                    <div className="relative">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-brand-primary/20 overflow-hidden">
                            {student.photoURL || student.avatarUrl ? (
                                <img src={student.photoURL || student.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xl md:text-2xl font-['Outfit'] font-black text-brand-primary">
                                    {student.displayName?.charAt(0)}
                                </span>
                            )}
                        </div>
                        {student.isPremium && (
                            <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-amber-400 p-0.5 md:p-1 rounded-md md:rounded-lg border-2 border-slate-950 shadow-lg">
                                <Crown size={10} className="text-slate-900 md:w-3 md:h-3" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl md:text-3xl font-['Outfit'] font-black tracking-tight text-white leading-tight">
                            {student.displayName || student.name || 'Alumno'}
                        </h1>
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] md:text-sm font-medium">
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {goalLabel}
                            </span>
                            <span>•</span>
                            <span>{student.techniqueLevel || student.experience || 'Principiante'}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-10">
                    <QuickStat label="Entrenos (30d)" value={studentData.stats.totalWorkouts} icon={Dumbbell} color="text-blue-400" />
                    <QuickStat label="Asistencia" value={`${studentData.stats.attendanceRate}%`} icon={Award} color="text-emerald-400" />
                    <QuickStat label="Cardio (kcal)" value={studentData.stats.totalCardioCalories || 0} icon={Activity} color="text-amber-400" />
                    <QuickStat label="Peso actual (kg)" value={student.weight || '--'} icon={Scale} color="text-violet-400" />
                </div>
                <WeightPath student={student} />

                {/* Weight Chart */}
                {chartData.length > 1 && (
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-8 border border-white/5 relative overflow-hidden group mb-6 md:mb-10 shadow-xl shadow-black/40">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] rounded-full"></div>
                        <div className="flex items-center justify-between mb-6 md:mb-8 relative z-10">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-lg md:rounded-xl border border-blue-500/20">
                                    <TrendingUp className="text-blue-400 w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <span className="font-['Outfit'] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-xs text-slate-400">Evolución</span>
                            </div>
                            <div className="text-[8px] md:text-[10px] font-black tracking-widest text-slate-500 uppercase">Últimos 10</div>
                        </div>
                        <div className="h-48 md:h-64 relative z-10">
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
                        { id: 'analytics', label: 'Analíticas', icon: BarChart2 },
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
                                    Últimos Entrenos
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
                                                        {(workout.startTime?.toDate?.() || workout.completedAt?.toDate?.())?.toLocaleDateString('es-AR') || 'Fecha desconocida'}
                                                    </div>
                                                </div>
                                                <CheckCircle2 className="text-green-400" size={18} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Student Info */}
                            <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 border border-white/5 relative overflow-hidden group shadow-xl shadow-black/30">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-primary to-brand-violet"></div>
                                <h3 className="font-['Outfit'] font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                        <User size={14} className="text-blue-400" />
                                    </div>
                                    Perfil del Atleta
                                </h3>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                                    <InfoRow label="Objetivo" value={goalLabel} icon={Target} />
                                    <InfoRow label="Frecuencia" value={student.trainingFrequency || student.daysPerWeek || '--'} icon={Calendar} />
                                    <InfoRow label="Nivel Técnica" value={student.techniqueLevel || '--'} icon={Award} />
                                    <InfoRow label="Años Exp." value={student.experienceYears || '--'} icon={History} />
                                    <InfoRow label="Metabolismo" value={student.metabolism || 'Estándar'} icon={Flame} />
                                    <InfoRow label="Altura" value={student.height ? `${student.height} cm` : '--'} icon={Ruler} />
                                    <InfoRow label="Lugar" value={student.trainingLocation || '--'} icon={MapPin} />
                                    <InfoRow label="Status" value={student.isPremium ? 'Elite Premium' : 'Atleta Free'} icon={Crown} premium={student.isPremium} />
                                </div>
                                {student.availableEquipment && student.availableEquipment.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-white/5">
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Equipamiento</div>
                                        <div className="flex flex-wrap gap-2">
                                            {student.availableEquipment.map((eq, i) => (
                                                <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-lg border border-white/5 font-bold">
                                                    {eq}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {student.injuries && student.injuries !== 'none' && (
                                    <div className="mt-6 pt-6 border-t border-white/5">
                                        <div className="text-[9px] font-black text-red-400/70 uppercase tracking-widest mb-2">Lesiones / Condiciones</div>
                                        <div className="text-sm text-red-400 font-bold">{student.injuries}</div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'analytics' && (
                        <motion.div
                            key="analiticas"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            {loadingAnalytics ? (
                                <div className="py-20 text-center">
                                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold">Analizando datos del atleta...</p>
                                </div>
                            ) : (analyticsData || showDemo) ? (
                                <div className="space-y-4">
                                    {showDemo && (
                                        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-amber-500 text-xs font-bold">
                                                <Sparkles size={14} />
                                                MODO DEMO ACTIVA (DATOS SIMULADOS)
                                            </div>
                                            <button
                                                onClick={() => setShowDemo(false)}
                                                className="text-[10px] font-black text-amber-500 uppercase underline"
                                            >
                                                Salir
                                            </button>
                                        </div>
                                    )}
                                    <StudentAnalytics
                                        analyticsData={showDemo ? ANALYTICS_DEMO_DATA : analyticsData}
                                        studentName={student.displayName}
                                    />
                                </div>
                            ) : (
                                <div className="py-20 text-center text-slate-500 bg-slate-900/50 rounded-3xl border border-white/5">
                                    <Activity size={40} className="mx-auto mb-4 opacity-20" />
                                    <p className="mb-6">No hay datos suficientes para generar analíticas avanzadas todavía.</p>
                                    <button
                                        onClick={() => setShowDemo(true)}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 mx-auto"
                                    >
                                        <Sparkles size={16} />
                                        Ver Demo de Analíticas
                                    </button>
                                </div>
                            )}
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
                                    <p className="text-slate-500 text-sm">No le asignaste ninguna rutina todavía</p>
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
                                                    {routine.days?.length || 0} días • {routine.goal || 'Sin objetivo'}
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

function WeightPath({ student }) {
    const weightHistory = student.weightHistory || [];
    const initialWeight = weightHistory.length > 0 ? weightHistory[0].weight : student.weight;
    const currentWeight = student.weight;
    const targetWeight = student.targetWeight;

    if (!targetWeight) {
        return (
            <div className="bg-slate-900/40 backdrop-blur-md rounded-xl p-3 border border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Peso Actual</span>
                <span className="text-sm font-black text-white">{currentWeight || '--'} kg</span>
            </div>
        );
    }

    const totalToChange = Math.abs(targetWeight - initialWeight);
    const changed = Math.abs(currentWeight - initialWeight);
    const progress = totalToChange > 0 ? Math.min(100, Math.max(0, (changed / totalToChange) * 100)) : 0;
    const remaining = (currentWeight - targetWeight).toFixed(1);

    return (
        <div className="bg-slate-900/40 backdrop-blur-md rounded-xl p-3 border border-white/5 relative overflow-hidden group shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-1.5">
                    <Scale className="text-purple-400 opacity-70" size={12} />
                    <span className="font-['Outfit'] font-black uppercase tracking-[0.15em] text-[10px] text-slate-500">Progreso</span>
                </div>
                <div className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
                    {remaining > 0 ? `-${remaining}kg` : remaining < 0 ? `+${Math.abs(remaining)}kg` : '¡Meta!'}
                </div>
            </div>

            <div className="flex items-center gap-3 relative px-1 h-6">
                {/* Start Label */}
                <div className="flex flex-col items-center min-w-[35px]">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter leading-none mb-0.5">Inicio</span>
                    <span className="text-[11px] font-black text-slate-400 font-['Outfit'] leading-none">{initialWeight}</span>
                </div>

                {/* Bar Container */}
                <div className="relative flex-1 h-1 flex items-center">
                    <div className="absolute inset-0 bg-white/10 rounded-full"></div>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    ></motion.div>

                    {/* Current Indicator *) */}
                    <motion.div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
                        animate={{ left: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                        <div className="bg-blue-600 px-1.5 py-0.5 rounded shadow-xl mb-1 flex items-center justify-center -mt-8">
                            <span className="text-[9px] font-black text-white leading-none">{currentWeight}</span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-white border-2 border-blue-600 shadow-md"></div>
                    </motion.div>
                </div>

                {/* Target Label *) *) *) *) *) *) *) */}
                <div className="flex flex-col items-center min-w-[35px]">
                    <span className="text-[7px] font-black text-purple-400 uppercase tracking-tighter leading-none mb-0.5">Meta</span>
                    <span className="text-[11px] font-black text-purple-300 font-['Outfit'] leading-none">{targetWeight}</span>
                </div>
            </div>
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
    const [scannedRoutineData, setScannedRoutineData] = useState(null); // Para guardar datos de IA
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    // Función para comprimir/redimensionar imagen antes de enviar a IA
    const processImage = async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Redimensionar si es muy grande (máximo 1200px)
                    const MAX_SIZE = 1200;
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Exportar como JPG para ahorrar espacio
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleScanRoutine = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        try {
            const base64Image = await processImage(file);

            // Call Gemini
            const aiData = await analyzeRoutineFromImage(base64Image);

            if (aiData) {
                setName(aiData.title || aiData.name || '');

                // CRÍTICO: Guardar aiData para usarlo en handleSubmit
                setScannedRoutineData(aiData);

                let exercisesText = "";

                // Si la IA devolvió días estructurados, formatearlos bonito
                if (aiData.days && aiData.days.length > 0) {
                    exercisesText = "\n\n--- RUTINA DETECTADA POR DÍAS ---";
                    aiData.days.forEach(d => {
                        exercisesText += `\n\n📌 ${d.day.toUpperCase()} (${d.focus || 'General'})\n`;
                        if (d.exercises) {
                            d.exercises.forEach(ex => {
                                exercisesText += `- ${ex.name}: ${ex.sets}x${ex.reps} ${ex.notes ? '(' + ex.notes + ')' : ''}\n`;
                            });
                        }
                    });
                } else if (aiData.exercises && aiData.exercises.length > 0) {
                    // Fallback a lista plana
                    exercisesText = "\n\n--- EJERCICIOS DETECTADOS ---\n" +
                        aiData.exercises.map(ex => `- ${ex.name}: ${ex.sets}x${ex.reps} ${ex.notes ? '(' + ex.notes + ')' : ''}`).join('\n');
                }

                setNotes((aiData.notes || aiData.description || '') + exercisesText);
            }
        } catch (error) {
            console.error("Error scanning routine:", error);
            const errorMsg = error.message?.includes('413')
                ? "La imagen es demasiado pesada. Intenta con una captura más pequeña."
                : `Error: ${error.message}. Intenta con otra imagen o escribe el nombre manualmente.`;
            alert(errorMsg);
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
                // Usar los datos escaneados si existen, sino array vacío
                days: scannedRoutineData?.days || [],
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
                    <div className="flex gap-2">
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleScanRoutine}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            ref={cameraInputRef}
                            onChange={handleScanRoutine}
                        />

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => cameraInputRef.current?.click()}
                            disabled={isScanning}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-600/30 transition-all disabled:opacity-50"
                        >
                            <Camera size={14} />
                            Capturar
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isScanning}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-700 transition-all disabled:opacity-50"
                        >
                            {isScanning ? (
                                <Wand2 className="animate-pulse" size={14} />
                            ) : (
                                <FileText size={14} />
                            )}
                            Galería
                        </motion.button>
                    </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 mb-6">
                    <div className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Formatos Permitidos</div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                        Sube imágenes en <span className="text-white font-bold">JPG, PNG o WEBP</span> o documentos <span className="text-white font-bold">PDF</span>.
                        Asegúrate de que el texto sea legible y haya buena luz.
                    </p>
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

const ANALYTICS_DEMO_DATA = {
    summary: {
        totalWorkouts: 24,
        totalVolume: 125400,
        totalSets: 312,
        avgDuration: 62,
        prCount: 18
    },
    charts: {
        volumeTrend: Array.from({ length: 12 }).map((_, i) => ({
            date: `20/${11 + Math.floor(i / 4)}/25`,
            volume: 8500 + (i * 450) + (Math.random() * 500),
            name: i % 2 === 0 ? 'Empuje' : 'Tracción'
        })),
        exercises: {
            'Sentadilla Libre': Array.from({ length: 8 }).map((_, i) => ({
                date: `${i + 1}/12/25`,
                maxWeight: 80 + (i * 5)
            })),
            'Press de Banca': Array.from({ length: 8 }).map((_, i) => ({
                date: `${i + 1}/12/25`,
                maxWeight: 60 + (i * 2.5)
            })),
            'Peso Muerto': Array.from({ length: 8 }).map((_, i) => ({
                date: `${i + 1}/12/25`,
                maxWeight: 100 + (i * 10)
            }))
        }
    },
    cardio: [
        { name: 'Running', durationMinutes: 45, caloriesBurned: 520, date: '2025-01-12' },
        { name: 'Natación', durationMinutes: 30, caloriesBurned: 350, date: '2025-01-10' },
        { name: 'Ciclismo', durationMinutes: 60, caloriesBurned: 600, date: '2025-01-08' }
    ],
    recentHistory: [
        {
            id: 'demo-1',
            date: new Date(),
            dayName: 'Empuje (Pecho/Hombro)',
            totalVolume: 12400,
            exercises: [
                { name: 'Press de Banca', sets: [{ weight: 80, reps: 8 }, { weight: 80, reps: 7 }], personalRecord: true },
                { name: 'Press Militar', sets: [{ weight: 45, reps: 10 }, { weight: 45, reps: 10 }] }
            ]
        },
        {
            id: 'demo-2',
            date: new Date(Date.now() - 86400000 * 2),
            dayName: 'Tracción (Espalda/Bíceps)',
            totalVolume: 11800,
            exercises: [
                { name: 'Dominadas', sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 10 }] },
                { name: 'Remo con Barra', sets: [{ weight: 70, reps: 10 }, { weight: 70, reps: 8 }] }
            ]
        }
    ]
};
