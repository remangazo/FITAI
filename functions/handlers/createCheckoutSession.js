const Stripe = require("stripe");
const { logger } = require("firebase-functions");

module.exports = async (req, res) => {
    // Initialize Stripe lazily (at runtime, when SECRET_KEY is available)
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return res.status(204).send("");
    }

    const { uid, email } = req.body;

    if (!uid || !email) {
        return res.status(400).send({ error: "Missing information" });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "FitAI Personal Premium",
                            description: "Rutinas y dietas ilimitadas",
                        },
                        unit_amount: 600, // $6.00
                        recurring: { interval: "month" },
                    },
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/dashboard`,
            customer_email: email,
            metadata: { userId: uid },
        });

        res.status(200).send({ sessionId: session.id, url: session.url });
    } catch (error) {
        logger.error("Stripe error:", error);
        res.status(500).send({ error: error.message });
    }
};
