const admin = require('firebase-admin');
try {
    const serviceAccount = require("./serviceAccountKey.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    console.log("Service account not found, using default credentials...");
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
                premiumSince: new Date(),
                subscriptionStatus: 'active',
                plan: 'test_premium'
            }));
        });

        await Promise.all(updates);
        console.log(`✅ User(s) with email ${email} are now PREMIUM!`);

    } catch (error) {
        console.error("Error setting premium:", error);
    }
}

setPremium('monte@gmail.com');
