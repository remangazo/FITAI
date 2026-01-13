/**
 * Firebase Function: Send Push Notification
 * 
 * Envía notificaciones push a usuarios específicos o a todos los usuarios.
 */

const admin = require('firebase-admin');

// Tipos de notificaciones predefinidas
const NOTIFICATION_TEMPLATES = {
    workout_reminder: {
        title: '💪 ¡Es hora de entrenar!',
        body: 'Tu rutina de hoy te espera. ¡Vamos a darle!',
        icon: '/logo192.png',
        click_action: '/dashboard'
    },
    nutrition_reminder: {
        title: '🍽️ No olvides registrar tu comida',
        body: 'Mantené tu registro de nutrición al día para mejores resultados.',
        icon: '/logo192.png',
        click_action: '/nutrition'
    },
    new_pr: {
        title: '🏆 ¡Nuevo Récord Personal!',
        body: 'Superaste tu marca anterior. ¡Excelente trabajo!',
        icon: '/logo192.png',
        click_action: '/progress'
    },
    streak_reminder: {
        title: '🔥 No pierdas tu racha',
        body: 'Llevas {days} días seguidos. ¡No pares ahora!',
        icon: '/logo192.png',
        click_action: '/dashboard'
    },
    premium_expiring: {
        title: '⭐ Tu Premium está por vencer',
        body: 'Renueva para no perder tus beneficios exclusivos.',
        icon: '/logo192.png',
        click_action: '/upgrade'
    },
    weekly_summary: {
        title: '📊 Resumen de la semana',
        body: 'Entrenaste {workouts} veces y quemaste {calories} kcal. ¡Gran trabajo!',
        icon: '/logo192.png',
        click_action: '/progress'
    },
    weekly_weight_reminder: {
        title: '⚖️ ¡Control de peso semanal!',
        body: 'Es domingo: registra tu peso para ver tu progreso esta semana.',
        icon: '/logo192.png',
        click_action: '/profile'
    },
    assigned_routine: {
        title: '🏋️ Nueva Rutina Asignada',
        body: 'Tu coach te ha asignado un nuevo plan de entrenamiento. ¡A darle con todo!',
        icon: '/logo192.png',
        click_action: '/dashboard'
    },
    coach_welcome: {
        title: '🧔‍♂️ ¡Bienvenido a FitAI Partners!',
        body: 'Tu torre de control está lista. Descubre cómo escalar tu negocio con IA.',
        icon: '/logo192.png',
        click_action: '/coach-dashboard'
    }
};

/**
 * Send notification to a specific user
 */
const sendNotificationToUser = async (userId, templateId, customData = {}) => {
    try {
        // Get user's FCM tokens
        const tokensSnapshot = await admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('fcmTokens')
            .get();

        if (tokensSnapshot.empty) {
            console.log(`[Notifications] No tokens found for user ${userId}`);
            return { success: false, reason: 'no_tokens' };
        }

        const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

        // Get template
        const template = NOTIFICATION_TEMPLATES[templateId];
        if (!template) {
            console.log(`[Notifications] Unknown template: ${templateId}`);
            return { success: false, reason: 'unknown_template' };
        }

        // Replace placeholders in body
        let body = template.body;
        Object.entries(customData).forEach(([key, value]) => {
            body = body.replace(`{${key}}`, value);
        });

        // Build message
        const message = {
            notification: {
                title: customData.title || template.title,
                body: customData.body || body
            },
            data: {
                url: customData.url || template.click_action,
                templateId,
                userId,
                timestamp: Date.now().toString(),
                ...customData
            },
            webpush: {
                fcmOptions: {
                    link: customData.url || template.click_action
                },
                notification: {
                    icon: template.icon,
                    badge: '/badge.png',
                    vibrate: [100, 50, 100]
                }
            }
        };

        // Send to all tokens
        const responses = await Promise.allSettled(
            tokens.map(token =>
                admin.messaging().send({ ...message, token })
            )
        );

        // Remove invalid tokens
        const invalidTokens = [];
        responses.forEach((result, index) => {
            if (result.status === 'rejected') {
                const error = result.reason;
                if (error.code === 'messaging/invalid-registration-token' ||
                    error.code === 'messaging/registration-token-not-registered') {
                    invalidTokens.push(tokens[index]);
                }
            }
        });

        // Clean up invalid tokens
        if (invalidTokens.length > 0) {
            const batch = admin.firestore().batch();
            for (const token of invalidTokens) {
                const tokenDoc = tokensSnapshot.docs.find(d => d.data().token === token);
                if (tokenDoc) {
                    batch.delete(tokenDoc.ref);
                }
            }
            await batch.commit();
            console.log(`[Notifications] Removed ${invalidTokens.length} invalid tokens`);
        }

        const successCount = responses.filter(r => r.status === 'fulfilled').length;
        console.log(`[Notifications] Sent to ${successCount}/${tokens.length} tokens for user ${userId}`);

        return {
            success: successCount > 0,
            sent: successCount,
            total: tokens.length,
            invalidRemoved: invalidTokens.length
        };

    } catch (error) {
        console.error('[Notifications] Error sending notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * HTTP endpoint to send a notification
 */
const sendPushNotification = async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(204).send('');
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, templateId, customData } = req.body;

        if (!userId || !templateId) {
            return res.status(400).json({ error: 'userId and templateId are required' });
        }

        const result = await sendNotificationToUser(userId, templateId, customData || {});

        return res.status(result.success ? 200 : 400).json(result);

    } catch (error) {
        console.error('[sendPushNotification] Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Scheduled function: Send daily workout reminders
 * Runs at 9:00 AM every day
 */
const sendDailyWorkoutReminders = async () => {
    console.log('[Scheduler] Sending daily workout reminders...');

    try {
        // Get users who have notifications enabled and haven't worked out today
        const usersSnapshot = await admin.firestore()
            .collection('users')
            .where('hasNotifications', '==', true)
            .get();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let sentCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;

            // Check if user has worked out today
            const workoutsToday = await admin.firestore()
                .collection('workouts')
                .where('userId', '==', userId)
                .where('startTime', '>=', today)
                .limit(1)
                .get();

            if (workoutsToday.empty) {
                // User hasn't worked out today - send reminder
                await sendNotificationToUser(userId, 'workout_reminder');
                sentCount++;
            }
        }

        console.log(`[Scheduler] Sent ${sentCount} workout reminders`);
        return { success: true, sent: sentCount };

    } catch (error) {
        console.error('[Scheduler] Error sending reminders:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPushNotification,
    sendNotificationToUser,
    sendDailyWorkoutReminders,
    NOTIFICATION_TEMPLATES
};
