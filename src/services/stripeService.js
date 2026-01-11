import { auth } from '../config/firebase';

const API_BASE = import.meta.env.VITE_FUNCTIONS_URL || 'https://us-central1-fitai-personal.cloudfunctions.net';

export const stripeService = {
    createCheckoutSession: async (priceId) => {
        if (!auth.currentUser) throw new Error("User not authenticated");

        const token = await auth.currentUser.getIdToken();

        const response = await fetch(`${API_BASE}/createCheckoutSession`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                uid: auth.currentUser.uid,
                email: auth.currentUser.email,
                priceId // Optional if backend supports multiple prices
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Error creating checkout session");
        }

        const session = await response.json();
        return session;
    }
};
