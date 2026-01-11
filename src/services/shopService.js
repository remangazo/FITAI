import { db } from '../config/firebase';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy
} from 'firebase/firestore';

const COLLECTION_NAME = 'products';

// Fallback data for testing/seeding
const SAMPLE_PRODUCTS = [
    // Suplementos
    { name: 'Whey Protein Isolate', category: 'protein', price: 45990, rating: 4.9, reviews: 234, image: '🥤', badge: 'Bestseller', description: 'Proteína de suero aislada de máxima pureza. 27g de proteína por servicio.', stock: 50 },
    { name: 'Creatina Monohidrato', category: 'supplements', price: 27990, rating: 4.8, reviews: 189, image: '💊', badge: 'Premium', description: 'Creatina micronizada para máxima absorción. 5g por servicio.', stock: 75 },
    { name: 'Pre-Workout Elite', category: 'supplements', price: 35990, originalPrice: 44990, rating: 4.7, reviews: 156, image: '⚡', badge: '-20%', description: 'Fórmula avanzada con citrulina, beta-alanina y cafeína.', stock: 30 },

    // Ropa
    { name: 'Camiseta FITAI Pro', category: 'apparel', price: 18990, rating: 4.9, reviews: 203, image: '👕', badge: 'Nueva', description: 'Camiseta técnica con tecnología DryFit.', stock: 100 },
    { name: 'Shorts Training Elite', category: 'apparel', price: 22990, rating: 4.7, reviews: 87, image: '🩳', description: 'Shorts con bolsillos laterales y tejido transpirable.', stock: 60 },

    // Equipamiento
    { name: 'Bandas de Resistencia Pro', category: 'equipment', price: 15990, rating: 4.8, reviews: 178, image: '🏋️', badge: 'Top Ventas', description: 'Set de 5 bandas con diferentes resistencias.', stock: 80 },
    { name: 'Cinturón Lumbar', category: 'equipment', price: 38990, rating: 4.9, reviews: 201, image: '🔗', badge: 'Pro Choice', description: 'Cinturón de cuero para levantamientos pesados.', stock: 30 },

    // Coaching
    { name: 'Plan Mensual FITAI PRO', category: 'coaching', price: 9990, rating: 5.0, reviews: 312, image: '🎯', badge: 'Suscripción', description: 'Rutinas y dietas personalizadas con IA + soporte.', stock: 999 },
];

export const shopService = {
    // Get all products
    getProducts: async () => {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));

            if (querySnapshot.empty) {
                // If DB empty (no permission or no data), return fallback without error
                return SAMPLE_PRODUCTS.map((p, index) => ({ id: `sample-${index}`, ...p }));
            }

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.warn("Firestore error (likely permissions). Falling back to local data:", error);
            // Fallback for demo/testing when DB is locked
            return SAMPLE_PRODUCTS.map((p, index) => ({ id: `sample-${index}`, ...p }));
        }
    },

    // Add new product
    addProduct: async (productData) => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...productData,
                createdAt: new Date().toISOString()
            });
            return { id: docRef.id, ...productData };
        } catch (error) {
            console.error("Error adding product:", error);
            throw error;
        }
    },

    // Update product
    updateProduct: async (productId, updateData) => {
        try {
            const productRef = doc(db, COLLECTION_NAME, productId);
            await updateDoc(productRef, {
                ...updateData,
                updatedAt: new Date().toISOString()
            });
            return { id: productId, ...updateData };
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    },

    // Delete product
    deleteProduct: async (productId) => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, productId));
            return productId;
        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    },

    // Seed initial data
    seedProducts: async () => {
        try {
            // Check if already has data
            const existing = await getDocs(collection(db, COLLECTION_NAME));
            if (!existing.empty) {
                console.log("Database already has products. Skipping seed.");
                return existing.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }

            const promises = SAMPLE_PRODUCTS.map(product =>
                addDoc(collection(db, COLLECTION_NAME), {
                    ...product,
                    createdAt: new Date().toISOString()
                })
            );

            await Promise.all(promises);
            console.log("Seeding completed successfully.");

            // Return seeded data
            const newDocs = await getDocs(collection(db, COLLECTION_NAME));
            return newDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error seeding products:", error);
            throw error;
        }
    }
};
