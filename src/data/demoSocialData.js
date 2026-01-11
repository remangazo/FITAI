// Demo data for Social section - simulated users, activities, and leaderboard
// This provides visual life to the community section before real users join

export const DEMO_USERS = [
    {
        id: 'demo_1',
        name: 'Carlos Mendoza',
        avatar: '🏋️',
        level: 12,
        isPremium: true,
        streak: 15,
        isLive: true,
        currentExercise: 'Bench Press'
    },
    {
        id: 'demo_2',
        name: 'María García',
        avatar: '💪',
        level: 8,
        isPremium: false,
        streak: 7,
        isLive: false
    },
    {
        id: 'demo_3',
        name: 'Diego Fernández',
        avatar: '🔥',
        level: 15,
        isPremium: true,
        streak: 23,
        isLive: true,
        currentExercise: 'Squat'
    },
    {
        id: 'demo_4',
        name: 'Ana López',
        avatar: '⚡',
        level: 6,
        isPremium: false,
        streak: 4,
        isLive: false
    },
    {
        id: 'demo_5',
        name: 'Roberto Silva',
        avatar: '🎯',
        level: 10,
        isPremium: true,
        streak: 11,
        isLive: false
    }
];

export const DEMO_ACTIVITIES = [
    {
        id: 'act_1',
        user: DEMO_USERS[0],
        type: 'workout',
        timeAgo: 'hace 2h',
        workout: {
            name: 'Día de Pecho y Tríceps',
            duration: 52,
            calories: 420,
            totalSets: 18,
            totalVolume: 8500,
            exercises: ['Bench Press', 'Incline DB Press', 'Cable Fly', 'Tricep Pushdown'],
            prs: [{ exercise: 'Bench Press', weight: 100, reps: 6 }]
        },
        kudos: 24,
        comments: 5,
        hasGivenKudos: false
    },
    {
        id: 'act_2',
        user: DEMO_USERS[2],
        type: 'workout',
        timeAgo: 'hace 4h',
        workout: {
            name: 'Leg Day Intenso',
            duration: 65,
            calories: 580,
            totalSets: 22,
            totalVolume: 12400,
            exercises: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Lunges'],
            prs: [
                { exercise: 'Squat', weight: 140, reps: 5 },
                { exercise: 'Romanian Deadlift', weight: 100, reps: 8 }
            ]
        },
        kudos: 47,
        comments: 12,
        hasGivenKudos: true
    },
    {
        id: 'act_3',
        user: DEMO_USERS[1],
        type: 'workout',
        timeAgo: 'hace 6h',
        workout: {
            name: 'Upper Body',
            duration: 45,
            calories: 320,
            totalSets: 15,
            totalVolume: 5200,
            exercises: ['Pull-ups', 'Shoulder Press', 'Rows', 'Bicep Curls'],
            prs: []
        },
        kudos: 18,
        comments: 3,
        hasGivenKudos: false
    },
    {
        id: 'act_4',
        user: DEMO_USERS[4],
        type: 'streak',
        timeAgo: 'hace 8h',
        achievement: {
            type: 'streak',
            value: 10,
            title: '¡10 días de racha!',
            icon: '🔥'
        },
        kudos: 32,
        comments: 8,
        hasGivenKudos: false
    },
    {
        id: 'act_5',
        user: DEMO_USERS[3],
        type: 'workout',
        timeAgo: 'ayer',
        workout: {
            name: 'Full Body',
            duration: 55,
            calories: 450,
            totalSets: 20,
            totalVolume: 7800,
            exercises: ['Deadlift', 'Bench Press', 'Rows', 'Squats'],
            prs: [{ exercise: 'Deadlift', weight: 80, reps: 5 }]
        },
        kudos: 21,
        comments: 4,
        hasGivenKudos: true
    }
];

export const DEMO_LEADERBOARD = {
    workouts: [
        { ...DEMO_USERS[2], value: 6, unit: 'entrenos' },
        { ...DEMO_USERS[0], value: 5, unit: 'entrenos' },
        { ...DEMO_USERS[4], value: 5, unit: 'entrenos' },
        { ...DEMO_USERS[1], value: 4, unit: 'entrenos' },
        { ...DEMO_USERS[3], value: 3, unit: 'entrenos' }
    ],
    volume: [
        { ...DEMO_USERS[2], value: 45600, unit: 'kg' },
        { ...DEMO_USERS[0], value: 38200, unit: 'kg' },
        { ...DEMO_USERS[4], value: 32100, unit: 'kg' },
        { ...DEMO_USERS[3], value: 28400, unit: 'kg' },
        { ...DEMO_USERS[1], value: 24800, unit: 'kg' }
    ],
    streak: [
        { ...DEMO_USERS[2], value: 23, unit: 'días' },
        { ...DEMO_USERS[0], value: 15, unit: 'días' },
        { ...DEMO_USERS[4], value: 11, unit: 'días' },
        { ...DEMO_USERS[1], value: 7, unit: 'días' },
        { ...DEMO_USERS[3], value: 4, unit: 'días' }
    ]
};

export const DEMO_CHALLENGES = [
    {
        id: 'ch_1',
        title: 'Enero Activo 2026',
        description: 'Completa 20 entrenos este mes',
        icon: '🎯',
        progress: 12,
        goal: 20,
        participants: 1247,
        daysLeft: 21,
        reward: '🏅 Badge + 500 XP',
        isJoined: true
    },
    {
        id: 'ch_2',
        title: 'Racha de Fuego',
        description: 'Mantén una racha de 7 días',
        icon: '🔥',
        progress: 4,
        goal: 7,
        participants: 856,
        daysLeft: null,
        reward: '🔥 Badge Especial',
        isJoined: true
    },
    {
        id: 'ch_3',
        title: '100K Club',
        description: 'Acumula 100,000 kg de volumen total',
        icon: '💪',
        progress: 45600,
        goal: 100000,
        participants: 423,
        daysLeft: 14,
        reward: '💎 Badge Premium',
        isJoined: false
    }
];

export const DEMO_WORKOUT_BUDDIES = [
    {
        id: 'buddy_1',
        user: DEMO_USERS[1],
        compatibility: 92,
        matchReasons: ['Mismo objetivo: Ganar músculo', 'Horario similar', 'Nivel compatible']
    },
    {
        id: 'buddy_2',
        user: DEMO_USERS[3],
        compatibility: 87,
        matchReasons: ['Mismo gimnasio', 'Frecuencia similar']
    },
    {
        id: 'buddy_3',
        user: DEMO_USERS[4],
        compatibility: 78,
        matchReasons: ['Objetivo compatible', 'Experiencia similar']
    }
];
