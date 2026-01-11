const admin = require('firebase-admin');

// 1. Initialize Firebase Admin
// Note: Ensure you have GOOGLE_APPLICATION_CREDENTIALS set or run this where authed
// Attempt to load service account locally for dev
const serviceAccountPath = "../functions/serviceAccountKey.json";
try {
    var serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    console.warn("Could not load local serviceAccountKey.json, trying default credentials...");
    admin.initializeApp();
}

const db = admin.firestore();

async function setPremium(email) {
    try {
        console.log(`Searching for user with email: ${email}...`);
        const snapshot = await db.collection('users').where('email', '==', email).get();

        if (snapshot.empty) {
            console.log('No user found with that email.');
            return;
        }

        const updates = [];
        snapshot.forEach(doc => {
            console.log(`Found user: ${doc.id} (${doc.data().name || 'No Name'})`);
            updates.push(db.collection('users').doc(doc.id).update({
                isPremium: true,
                premiumSince: new Date()
            }));
        });

        await Promise.all(updates);
        console.log(`✅ User(s) with email ${email} are now PREMIUM!`);

    } catch (error) {
        console.error("Error setting premium:", error);
    }
}

setPremium('monte@gmail.com');
