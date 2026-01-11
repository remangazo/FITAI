# FitAI Personal 🏋️‍♂️🥗

SaaS de fitness impulsado por IA que genera rutinas de entrenamiento y dietas personalizadas.

## 🚀 Características

- **Rutinas personalizadas** con Gemini 1.5 Flash
- **Dietas adaptadas** a cultura argentina (asado light, mate, milanesas veganas)
- **Modelo freemium**: 1 generación/mes gratis, ilimitado con Premium ($5-10/mes)
- **i18n**: Español e Inglés
- **Métricas flexibles**: kg/cm o lb/ft
- **Dashboard interactivo** con gráficos de progreso

## 🛠️ Tech Stack

| Frontend | Backend | Database | AI | Payments |
|----------|---------|----------|-----|----------|
| React 19 | Firebase Functions | Firestore | Gemini 1.5 Flash | Stripe |
| Vite | Node.js | Firebase Auth | | |
| TailwindCSS | | Firebase Storage | | |
| Framer Motion | | | | |

## 📦 Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/fitai-personal.git
cd fitai-personal

# Instalar dependencias
npm install
cd functions && npm install && cd ..

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales Firebase
```

## 🔧 Configuración Firebase

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar Authentication (Email/Password + Google)
3. Crear base de datos Firestore
4. Configurar Cloud Functions
5. Agregar secretos:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY
   firebase functions:secrets:set STRIPE_SECRET_KEY
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   ```

## 🏃 Desarrollo

```bash
# Frontend
npm run dev

# Functions (emulador)
cd functions
npm run serve
```

## 🚀 Deploy

```bash
# Build frontend
npm run build

# Deploy todo
firebase deploy

# Solo hosting
firebase deploy --only hosting

# Solo functions
firebase deploy --only functions
```

## 📁 Estructura

```
fitai-personal/
├── src/
│   ├── pages/          # Login, Dashboard, Onboarding, Settings
│   ├── context/        # AuthContext
│   ├── config/         # Firebase config
│   ├── locales/        # i18n (es, en)
│   └── App.jsx
├── functions/
│   ├── handlers/       # generateRoutine, generateDiet, stripeWebhook
│   └── index.js
├── firestore.rules
└── firebase.json
```

## 🔐 Variables de Entorno

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FUNCTIONS_URL=https://us-central1-TU_PROYECTO.cloudfunctions.net
```

## 📊 Esquema Firestore

- `users`: Estado suscripción, isPremium
- `profiles`: Datos usuario (edad, peso, altura, objetivo)
- `routines`: Rutinas generadas por IA
- `diets`: Planes nutricionales generados

## 🌐 Dominio (Hostinger)

1. En Hostinger DNS, agregar registro A apuntando a IP de Firebase Hosting
2. Verificar dominio en Firebase Console
3. Esperar propagación DNS (hasta 48h)

## 📝 Licencia

MIT
