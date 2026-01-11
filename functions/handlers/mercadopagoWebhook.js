const admin = require("firebase-admin");
const axios = require("axios");
const { logger } = require("firebase-functions");

module.exports = async (req, res) => {
    // MP sends notifications via POST body or query params depending on version/topic
    const action = req.body.action || req.query.action;
    const type = req.body.type || req.query.topic;
    const dataId = (req.body.data && req.body.data.id) || req.query.id;

    logger.info("Mercado Pago Webhook:", { action, type, dataId });

    if (type === "payment" || action === "payment.created" || action === "payment.updated") {
        const paymentId = dataId;

        if (paymentId) {
            try {
                // Fetch payment details from Mercado Pago
                const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
                if (!mpToken) {
                    logger.error("MERCADOPAGO_ACCESS_TOKEN not set");
                    return res.status(500).send("Server config error");
                }

                const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                    headers: {
                        Authorization: `Bearer ${mpToken}`
                    }
                });

                const paymentData = response.data;

                // Check status
                if (paymentData.status === "approved") {
                    // Extract user ID from metadata (we sent it in lower_case in createMPPreference)
                    const userId = paymentData.metadata?.user_id;

                    if (userId) {
                        await admin.firestore().collection("users").doc(userId).set({
                            isPremium: true,
                            premiumProvider: 'mercadopago',
                            mercadopagoPaymentId: paymentId,
                            subscriptionType: paymentData.metadata?.plan_id || 'monthly',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        }, { merge: true });

                        logger.info(`User ${userId} upgraded via Mercado Pago payment ${paymentId}`);
                    } else {
                        logger.warn(`No userId in metadata for payment ${paymentId}`);
                    }
                } else {
                    logger.info(`Payment ${paymentId} status: ${paymentData.status}`);
                }
            } catch (error) {
                logger.error(`Error processing MP webhook for payment ${paymentId}:`, error.message);
            }
        }
    }

    // Always respond with 200 to acknowledge MP
    res.status(200).send("OK");
};
