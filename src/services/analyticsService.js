import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    increment,
    getDocs,
    query,
    orderBy,
    limit,
    getDoc,
    setDoc
} from 'firebase/firestore';

const ANALYTICS_COLLECTION = 'analytics_store';
const PRODUCTS_COLLECTION = 'products';

export const analyticsService = {
    /**
     * Incrementa el contador de vistas de un producto.
     */
    trackProductView: async (productId) => {
        try {
            const productRef = doc(db, PRODUCTS_COLLECTION, productId);
            await updateDoc(productRef, {
                views: increment(1)
            });
        } catch (error) {
            console.error("Error tracking product view:", error);
            // Si el campo 'views' no existe todavía, lo creamos
            try {
                const productRef = doc(db, PRODUCTS_COLLECTION, productId);
                await updateDoc(productRef, { views: 1 });
            } catch (innerError) {
                console.warn("Retry failed. View not tracked.");
            }
        }
    },

    /**
     * Registra un término de búsqueda.
     */
    trackSearch: async (searchTerm) => {
        if (!searchTerm || searchTerm.trim().length < 3) return;

        const term = searchTerm.toLowerCase().trim();
        const searchRef = doc(db, ANALYTICS_COLLECTION, 'searches', 'terms', term);

        try {
            await setDoc(searchRef, {
                term,
                count: increment(1),
                lastSearched: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error("Error tracking search term:", error);
        }
    },

    /**
     * Registra una orden de venta.
     */
    recordOrder: async (orderData) => {
        try {
            // 1. Guardar la orden individual para historial y ticket promedio
            const ordersRef = collection(db, ANALYTICS_COLLECTION, 'data', 'orders');
            await addDoc(ordersRef, {
                ...orderData,
                timestamp: new Date().toISOString()
            });

            // 2. Incrementar contador de ventas por producto (bestsellers)
            for (const item of orderData.items) {
                const productRef = doc(db, PRODUCTS_COLLECTION, item.id);
                await updateDoc(productRef, {
                    salesCount: increment(item.quantity || 1),
                    totalRevenue: increment(item.price * (item.quantity || 1))
                }).catch(async () => {
                    // Fallback si campos no existen
                    await updateDoc(productRef, {
                        salesCount: item.quantity || 1,
                        totalRevenue: item.price * (item.quantity || 1)
                    });
                });
            }

            // 3. Actualizar métricas generales diarias
            const today = new Date().toISOString().split('T')[0];
            const dailyRef = doc(db, ANALYTICS_COLLECTION, 'data', 'daily_stats', today);
            await setDoc(dailyRef, {
                totalOrders: increment(1),
                totalRevenue: increment(orderData.total),
                lastUpdate: new Date().toISOString()
            }, { merge: true });

        } catch (error) {
            console.error("Error recording order:", error);
            throw error;
        }
    },

    /**
     * Recupera el top de productos más vendidos.
     */
    getBestsellers: async (top = 5) => {
        try {
            const q = query(
                collection(db, PRODUCTS_COLLECTION),
                orderBy('salesCount', 'desc'),
                limit(top)
            );
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching bestsellers:", error);
            return [];
        }
    },

    /**
     * Recupera los términos más buscados.
     */
    getTopSearches: async (top = 10) => {
        try {
            const q = query(
                collection(db, ANALYTICS_COLLECTION, 'searches', 'terms'),
                orderBy('count', 'desc'),
                limit(top)
            );
            const snap = await getDocs(q);
            return snap.docs.map(doc => doc.data());
        } catch (error) {
            console.error("Error fetching top searches:", error);
            return [];
        }
    },

    /**
     * Obtiene métricas generales (Ticket promedio, etc)
     */
    getGlobalAnalytics: async () => {
        try {
            const q = collection(db, ANALYTICS_COLLECTION, 'data', 'orders');
            const snap = await getDocs(q);
            const orders = snap.docs.map(doc => doc.data());

            if (orders.length === 0) return { avgTicket: 0, totalRevenue: 0, totalOrders: 0 };

            const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
            return {
                avgTicket: Math.round(totalRevenue / orders.length),
                totalOrders: orders.length,
                totalRevenue
            };
        } catch (error) {
            console.error("Error fetching global analytics:", error);
            return { avgTicket: 0, totalRevenue: 0, totalOrders: 0 };
        }
    }
};
