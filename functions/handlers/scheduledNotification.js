const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions");

/**
 * Scheduled function to send workout reminders
 * Runs every hour to check who needs to train
 */
exports.scheduledWorkoutReminders = onSchedule("every 1 hours", async (event) => {
    const db = admin.firestore();
    const messaging = admin.messaging();

    // Get current time in UTC
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentDay = now.toLocaleDateString("es-ES", { weekday: "long" }).toLowerCase();

    // Map Spanish days for consistency (Firestore data might be varied)
    const dayMap = {
        "lunes": "Lunes", "martes": "Martes", "miércoles": "Miércoles",
        "jueves": "Jueves", "viernes": "Viernes", "sábado": "Sábado", "domingo": "Domingo"
    };
    const todayName = dayMap[currentDay] || Object.values(dayMap).find(d => d.toLowerCase() === currentDay);

    logger.info(`Running scheduled reminders for hour UTC: ${currentHour}, Day: ${todayName}`);

    try {
        // Query users who have enabled reminders and match current hour preferences
        // Note: Storing timezone offset or preferred UTC hour is crucial. 
        // For simplicity, we assume users stored their preferred reminder time in hour-only format (0-23) adjusted to UTC or we check local time if stored.
        // A better approach: Store "reminderHourUTC" in user profile.

        const usersSnap = await db.collection("users")
            .where("notificationPreferences.workoutReminder", "==", true)
            .get();

        if (usersSnap.empty) {
            logger.info("No users with reminders enabled.");
            return;
        }

        const promises = [];

        for (const doc of usersSnap.docs) {
            const userData = doc.data();
            const prefs = userData.notificationPreferences || {};
            const userId = doc.id;

            // check active routine days
            // If we want to be smart, we check if today is a training day in their active routine
            // Or simpler: rely on 'reminderDays' if stored in prefs

            // 1. Check time (very simplified: assumed stored hour matches current check)
            // Real implementation requires handling user timezones. 
            // For MVP: We send if prefs.reminderHour == currentHour (assuming server time or standardized)
            // Let's assume frontend saves 'reminderHourUTC'.

            if (prefs.reminderHourUTC !== currentHour) continue;

            // 2. Check if should train today based on Routine
            // Fetch active routine
            const routineSnap = await db.collection("routines")
                .where("userId", "==", userId)
                .where("isActive", "==", true)
                .limit(1)
                .get();

            let shouldTrain = false;
            let dayRoutineName = "Entrenamiento";

            if (!routineSnap.empty) {
                const routine = routineSnap.docs[0].data();
                // Check if today matches any day name in routine
                const todayRoutine = routine.days?.find(d =>
                    d.split_name?.toLowerCase().includes(currentDay) ||
                    d.name?.toLowerCase().includes(currentDay)
                );

                if (todayRoutine) {
                    shouldTrain = true;
                    dayRoutineName = todayRoutine.split_name || routine.name;
                } else if (prefs.reminderDays?.includes(todayName)) {
                    // Fallback to explicit preference days if routine doesn't employ named days
                    shouldTrain = true;
                }
            } else {
                // No active routine, rely only on prefs
                if (prefs.reminderDays?.includes(todayName)) {
                    shouldTrain = true;
                }
            }

            if (shouldTrain && userData.lastFcmToken) {
                const message = {
                    notification: {
                        title: "¡Hora de Entrenar! 💪",
                        body: `Hoy toca: ${dayRoutineName}. ¡Vamos por ello!`,
                    },
                    token: userData.lastFcmToken,
                    data: {
                        type: "workout_reminder",
                        url: "/dashboard"
                    }
                };

                promises.push(
                    messaging.send(message)
                        .then(() => logger.info(`Reminder sent to user ${userId}`))
                        .catch(e => logger.error(`Failed to send to ${userId}:`, e))
                );
            }
        }

        await Promise.all(promises);
        logger.info(`Processed ${promises.length} reminders.`);

    } catch (error) {
        logger.error("Error in scheduled reminders:", error);
    }
});
