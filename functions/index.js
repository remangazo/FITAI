const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
// const { onSchedule } = require("firebase-functions/v2/scheduler"); // Requires GCP Cloud Scheduler API
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();

// Set global options to use the closest region if possible, e.g. southamerica-east1 for Argentina or us-central1
setGlobalOptions({ region: "us-central1" });

const generateRoutine = require("./handlers/generateRoutine");
const generateDiet = require("./handlers/generateDiet");
const stripeWebhook = require("./handlers/stripeWebhook");
const createCheckoutSession = require("./handlers/createCheckoutSession");
const createMPPreference = require("./handlers/createMPPreference");
const mercadopagoWebhook = require("./handlers/mercadopagoWebhook");
const { sendPushNotification } = require("./handlers/sendPushNotification");
const aiProxy = require("./handlers/aiProxy");
const { exportUserData, deleteUserAccount } = require("./handlers/gdpr");
const { onUserPremiumConversion, onStudentOnboardingComplete } = require("./handlers/trainerRewards");

// Existing handlers
exports.generateRoutine = onRequest(generateRoutine);
exports.generateDiet = onRequest(generateDiet);
exports.stripeWebhook = onRequest(stripeWebhook);
exports.createCheckoutSession = onRequest(createCheckoutSession);
exports.createMPPreference = onRequest(createMPPreference);
exports.mercadopagoWebhook = onRequest(mercadopagoWebhook);

// Push Notifications
exports.sendPushNotification = onRequest(sendPushNotification);

// AI Proxy (secure, rate-limited)
exports.aiProxy = onRequest(aiProxy);

// GDPR Compliance
exports.exportUserData = onRequest(exportUserData);
exports.deleteUserAccount = onRequest(deleteUserAccount);

// Scheduled Tasks
const { scheduledWorkoutReminders } = require("./handlers/scheduledNotification");
exports.scheduledWorkoutReminders = scheduledWorkoutReminders;

// Trainer Rewards - Firestore triggers
exports.onUserPremiumConversion = onDocumentUpdated("users/{userId}", (event) => {
    return onUserPremiumConversion(event, { params: event.params });
});

exports.onStudentOnboardingComplete = onDocumentUpdated("users/{userId}", (event) => {
    return onStudentOnboardingComplete(event, { params: event.params });
});

// TODO: Enable after configuring GCP Cloud Scheduler API
// exports.dailyWorkoutReminder = onSchedule("0 12 * * *", sendDailyWorkoutReminders);

