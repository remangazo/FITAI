const admin = require("firebase-admin");
const Stripe = require("stripe");
const { logger } = require("firebase-functions");

module.exports = async (req, res) => {
    // Initialize Stripe lazily (at runtime, when SECRET_KEY is available)
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
        logger.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
            const userId = session.metadata.userId;

            await admin.firestore().collection("users").doc(userId).set({
                isPremium: true,
                stripeCustomerId: session.customer,
                subscriptionId: session.subscription,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            logger.info(`User ${userId} upgraded to Premium`);
            break;
        }
        case "customer.subscription.deleted": {
            const subscription = event.data.object;
            const snapshot = await admin.firestore()
                .collection("users")
                .where("subscriptionId", "==", subscription.id)
                .limit(1)
                .get();

            if (!snapshot.empty) {
                const userId = snapshot.docs[0].id;
                await admin.firestore().collection("users").doc(userId).update({
                    isPremium: false,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                logger.info(`User ${userId} subscription cancelled`);
            }
            break;
        }
    }

    res.json({ received: true });
};
