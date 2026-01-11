const admin = require('firebase-admin');

// 1. Initialize Firebase Admin
// Note: Ensure you have GOOGLE_APPLICATION_CREDENTIALS set or run this where authed
var serviceAccount = require("../functions/serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setPremium(email) {
    try {
        console.log(`Searching for user with email: ${email}...`);
        const snapshot = await db.collection('users').where('email', '==', email).get();

        if (snapshot.empty) {
            console.log('No user found with that email.');
            return;
        }

        snapshot.forEach(async doc => {
            console.log(`Found user: ${doc.id} (${doc.data().name || 'No Name'})`);
            await db.collection('users').doc(doc.id).update({
                isPremium: true,
                premiumSince: new Date()
            });
            console.log(`✅ User ${doc.id} is now PREMIUM!`);
        });

    } catch (error) {
        console.error("Error setting premium:", error);
    }
}

setPremium('monte@gmail.com');
