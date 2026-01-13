const { Resend } = require('resend');

/**
 * Sends a premium welcome email to a new user
 * @param {Object} user - The Firebase Auth user object
 */
const welcomeEmail = async (user) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const userEmail = user.email;
    const userName = user.displayName || 'Atleta';

    try {
        const { data, error } = await resend.emails.send({
            from: 'FitAI <onboarding@resend.dev>', // Cambiar a dominio verificado en producción
            to: [userEmail],
            subject: 'Bienvenido a la Élite: Tu Evolución IA comienza hoy 🦾',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Inter', sans-serif; background-color: #09090b; color: #ffffff; padding: 40px; }
                        .container { max-width: 600px; margin: 0 auto; background: #111114; border: 1px solid #1f1f23; border-radius: 24px; overflow: hidden; }
                        .header { background: linear-gradient(to bottom right, #6366f1, #8b5cf6); padding: 40px; text-align: center; }
                        .content { padding: 40px; line-height: 1.6; }
                        .footer { padding: 20px; text-align: center; font-size: 12px; color: #4b5563; }
                        h1 { font-family: 'Outfit', sans-serif; text-transform: uppercase; font-style: italic; font-weight: 900; margin: 0; font-size: 24px; letter-spacing: -1px; }
                        .button { display: inline-block; background: #ffffff; color: #09090b; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; text-transform: uppercase; font-size: 14px; margin-top: 20px; }
                        .highlight { color: #6366f1; font-weight: 700; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>FIT<span style="color: rgba(255,255,255,0.7)">AI</span> COACH</h1>
                        </div>
                        <div class="content">
                            <h2>Hola, ${userName} 👋</h2>
                            <p>Bienvenido a <span class="highlight">FitAI</span>. Has dado el primer paso para hackear tu biología y llevar tu rendimiento al siguiente nivel.</p>
                            <p>Nuestra inteligencia artificial ya está analizando los datos para crear tu primer plan de entrenamiento y nutrición 100% adaptativo.</p>
                            <h3>¿Qué sigue ahora?</h3>
                            <ul>
                                <li>Completa tu perfil metabólico en la app.</li>
                                <li>Genera tu primera rutina IA.</li>
                                <li>Conecta con la comunidad de élite.</li>
                            </ul>
                            <a href="https://fitai-personal.web.app" class="button">ENTRAR A MI PANEL</a>
                        </div>
                        <div class="footer">
                            FitAI - Intelligence for Elite Performance<br>
                            Este es un correo automático, no es necesario responder.
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('Error enviando email via Resend:', error);
            return { success: false, error };
        }

        console.log('Email de bienvenida enviado exitosamente a:', userEmail, data.id);
        return { success: true, id: data.id };

    } catch (err) {
        console.error('Excepción al enviar email:', err);
        return { success: false, error: err.message };
    }
};

module.exports = welcomeEmail;
