// GDPR Compliance Handler - Export and Delete User Data
// Implements rights under GDPR: Right to Access, Right to Erasure

const admin = require("firebase-admin");

// Export all user data
async function exportUserData(req, res) {
    // CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(204).send("");
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    let userId;
    try {
        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid;
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }

    try {
        const db = admin.firestore();
        const exportData = {
            exportDate: new Date().toISOString(),
            userId: userId,
            collections: {}
        };

        // Collections to export (all user data)
        const collections = [
            { name: "users", field: null, isDoc: true },
            { name: "routines", field: "userId" },
            { name: "diets", field: "userId" },
            { name: "workouts", field: "userId" },
            { name: "activities", field: "userId" },
            { name: "communityPosts", field: "userId" },
        ];

        for (const col of collections) {
            if (col.isDoc) {
                // Direct document by userId
                const docRef = db.collection(col.name).doc(userId);
                const docSnap = await docRef.get();
                if (docSnap.exists) {
                    exportData.collections[col.name] = docSnap.data();
                }
            } else {
                // Query by userId field
                const querySnap = await db.collection(col.name)
                    .where(col.field, "==", userId)
                    .get();

                exportData.collections[col.name] = [];
                querySnap.forEach(doc => {
                    exportData.collections[col.name].push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
            }
        }

        // Export nutrition logs (compound key)
        const nutritionLogsSnap = await db.collection("nutritionLogs")
            .where(admin.firestore.FieldPath.documentId(), ">=", userId)
            .where(admin.firestore.FieldPath.documentId(), "<", userId + "~")
            .get();

        exportData.collections.nutritionLogs = [];
        nutritionLogsSnap.forEach(doc => {
            exportData.collections.nutritionLogs.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Log the export request for audit
        await db.collection("gdprRequests").add({
            userId: userId,
            type: "export",
            requestedAt: admin.firestore.FieldValue.serverTimestamp(),
            completedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.status(200).json({
            success: true,
            message: "Datos exportados correctamente",
            data: exportData
        });

    } catch (error) {
        console.error("GDPR Export Error:", error);
        return res.status(500).json({ error: "Error al exportar datos" });
    }
}

// Delete user account and all data
async function deleteUserAccount(req, res) {
    // CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(204).send("");
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    let userId;
    try {
        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid;
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }

    // Require confirmation in body
    const { confirmDelete } = req.body || {};
    if (confirmDelete !== "ELIMINAR MI CUENTA") {
        return res.status(400).json({
            error: "Debes confirmar la eliminación enviando: { confirmDelete: 'ELIMINAR MI CUENTA' }"
        });
    }

    try {
        const db = admin.firestore();
        const batch = db.batch();
        let deleteCount = 0;

        // Collections to delete
        const collections = [
            { name: "routines", field: "userId" },
            { name: "diets", field: "userId" },
            { name: "workouts", field: "userId" },
            { name: "activities", field: "userId" },
            { name: "communityPosts", field: "userId" },
        ];

        for (const col of collections) {
            const querySnap = await db.collection(col.name)
                .where(col.field, "==", userId)
                .get();

            querySnap.forEach(doc => {
                batch.delete(doc.ref);
                deleteCount++;
            });
        }

        // Delete nutrition logs
        const nutritionLogsSnap = await db.collection("nutritionLogs")
            .where(admin.firestore.FieldPath.documentId(), ">=", userId)
            .where(admin.firestore.FieldPath.documentId(), "<", userId + "~")
            .get();

        nutritionLogsSnap.forEach(doc => {
            batch.delete(doc.ref);
            deleteCount++;
        });

        // Delete user profile
        const userDocRef = db.collection("users").doc(userId);
        batch.delete(userDocRef);
        deleteCount++;

        // Execute batch delete
        await batch.commit();

        // Log the deletion request before deleting auth
        await db.collection("gdprRequests").add({
            userId: userId,
            type: "delete",
            requestedAt: admin.firestore.FieldValue.serverTimestamp(),
            documentsDeleted: deleteCount
        });

        // Delete Firebase Auth user
        await admin.auth().deleteUser(userId);

        return res.status(200).json({
            success: true,
            message: "Cuenta eliminada correctamente",
            documentsDeleted: deleteCount
        });

    } catch (error) {
        console.error("GDPR Delete Error:", error);
        return res.status(500).json({ error: "Error al eliminar cuenta" });
    }
}

module.exports = {
    exportUserData,
    deleteUserAccount
};
