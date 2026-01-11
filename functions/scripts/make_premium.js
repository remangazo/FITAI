const admin = require('firebase-admin');

// Initialize Firebase Admin (uses Default Credentials)
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

const makeUserPremium = async (email) => {
    try {
        console.log(`Searching for user with email: ${email}...`);

        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (snapshot.empty) {
            console.log('No user found with that email.');
            return;
        }

        const updates = [];
        snapshot.forEach(doc => {
            console.log(`Found user: ${doc.id} (${doc.data().displayName || 'No Name'})`);
            const updatePromise = doc.ref.update({
                isPremium: true,
                subscriptionStatus: 'active',
                subscriptionId: 'manual_override_admin', // Marker for manual update
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            updates.push(updatePromise);
        });

        await Promise.all(updates);
        console.log(`Successfully granted PREMIUM status to ${updates.length} user(s).`);

    } catch (error) {
        console.error('Error updating user:', error);
    }
};

// Run
makeUserPremium('monte@gmail.com');
