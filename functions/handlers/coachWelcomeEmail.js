const { Resend } = require('resend');
const { sendNotificationToUser } = require('./sendPushNotification');

/**
 * Sends a premium profile welcome email and notification to a new coach
 * @param {Object} trainerData - The data from the trainers collection
 * @param {string} trainerId - The ID of the trainer
 */
const coachWelcomeEmail = async (trainerData, trainerId) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const userEmail = trainerData.email;
    const userName = trainerData.displayName || 'Coach';

    try {
        // 1. Send Email
        const { data, error } = await resend.emails.send({
            from: 'FitAI Partner <onboarding@resend.dev>', // Cambiar a dominio verificado
            to: [userEmail],
            subject: '🧔‍♂️ Bienvenido Partner: Tu Torre de Control FitAI está lista',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Inter', sans-serif; background-color: #09090b; color: #ffffff; padding: 40px; margin: 0; }
                        .container { max-width: 600px; margin: 0 auto; background: #111114; border: 1px solid #1f1f23; border-radius: 24px; overflow: hidden; }
                        .header { background: linear-gradient(to bottom right, #10b981, #3b82f6); padding: 50px 40px; text-align: center; }
                        .content { padding: 40px; line-height: 1.6; }
                        .footer { padding: 30px; text-align: center; font-size: 12px; color: #4b5563; background: #0c0c0e; border-top: 1px solid #1f1f23; }
                        h1 { font-family: 'Outfit', sans-serif; text-transform: uppercase; font-style: italic; font-weight: 900; margin: 0; font-size: 32px; letter-spacing: -1.5px; color: #ffffff; }
                        h2 { font-size: 22px; margin-top: 0; color: #ffffff; }
                        .button { display: inline-block; background: #ffffff; color: #09090b; padding: 18px 36px; text-decoration: none; border-radius: 14px; font-weight: 800; text-transform: uppercase; font-size: 14px; margin-top: 25px; }
                        .highlight { color: #10b981; font-weight: 700; }
                        .card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 20px; margin: 15px 0; }
                        .card-title { color: #10b981; font-weight: 800; font-size: 16px; margin-bottom: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>FIT<span style="color: rgba(255,255,255,0.7)">AI</span> PARTNER</h1>
                        </div>
                        <div class="content">
                            <h2>Hola, Coach ${userName} 👋</h2>
                            <p>Has activado tu perfil profesional en <span class="highlight">FitAI</span>. Ahora tienes el poder de la Inteligencia Artificial para escalar tu negocio.</p>
                            
                            <div class="card">
                                <div class="card-title">🚀 TU CÓDIGO DE COACH</div>
                                <p style="margin: 0; font-size: 14px;">Comparte tu código con tus alumnos para vincularlos a tu panel y supervisar sus progresos en tiempo real.</p>
                            </div>

                            <div class="card">
                                <div class="card-title">💎 BENEFICIOS DE ÉLITE</div>
                                <ul style="margin: 0; padding-left: 15px; font-size: 14px; color: #a1a1aa;">
                                    <li><strong>Gestión Masiva</strong>: Controla múltiples alumnos con la misma eficiencia.</li>
                                    <li><strong>IA Asistida</strong>: Genera bases de rutinas y dietas al instante.</li>
                                    <li><strong>Monetización</strong>: Recibe recompensas por cada alumno Premium.</li>
                                </ul>
                            </div>

                            <center>
                                <a href="https://fitai-personal.web.app/coach-dashboard" class="button">IR AL PANEL DE CONTROL</a>
                            </center>
                        </div>
                        <div class="footer">
                            FitAI Partners | The Future of Coaching
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('[CoachOnboarding] Error sending email:', error);
        } else {
            console.log('[CoachOnboarding] Welcome email sent to coach:', userEmail);
        }

        // 2. Send Push Notification
        await sendNotificationToUser(trainerId, 'coach_welcome');

        return { success: !error };

    } catch (err) {
        console.error('[CoachOnboarding] Exception:', err);
        return { success: false, error: err.message };
    }
};

module.exports = coachWelcomeEmail;
