const { MercadoPagoConfig, Preference } = require('mercadopago');
const { logger } = require("firebase-functions");

module.exports = async (req, res) => {
    // CORS
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return res.status(204).send("");
    }

    const { uid, email, plan } = req.body;

    if (!uid || !email || !plan) {
        return res.status(400).send({ error: "Missing information" });
    }

    try {
        // Initialize Mercado Pago client
        const client = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-YOUR-ACCESS-TOKEN'
        });
        const preference = new Preference(client);

        const planName = plan === 'annual' ? 'FitAI Premium Anual' : 'FitAI Premium Mensual';
        const price = plan === 'annual' ? 39.99 : 4.99;

        const body = {
            items: [
                {
                    id: plan,
                    title: planName,
                    description: "Acceso total a rutinas y dietas inteligentes de FitAI",
                    quantity: 1,
                    unit_price: price,
                    currency_id: "USD" // Adjust if needed, e.g., "ARS", "BRL", "MXN"
                }
            ],
            payer: {
                email: email
            },
            metadata: {
                userId: uid,
                planId: plan
            },
            back_urls: {
                success: `${req.headers.origin}/dashboard?payment=success`,
                failure: `${req.headers.origin}/upgrade?payment=failure`,
                pending: `${req.headers.origin}/dashboard?payment=pending`
            },
            auto_return: "approved",
            notification_url: `${process.env.VITE_FUNCTIONS_URL || 'https://us-central1-fitai-dev.cloudfunctions.net'}/mercadopagoWebhook`
        };

        const result = await preference.create({ body });

        res.status(200).send({ preferenceId: result.id, init_point: result.init_point });
    } catch (error) {
        logger.error("Mercado Pago error:", error);
        res.status(500).send({ error: error.message });
    }
};
