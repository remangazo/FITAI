# Arquitectura Técnica y Escalabilidad - FitAI

Este documento detalla la estructura actual y la hoja de ruta de escalabilidad de FitAI, integrando los conceptos fundamentales de diseño de sistemas de alta disponibilidad.

## 1. Stack Tecnológico Actual
- **Frontend**: React + Tailwind CSS (Vite para build optimizado).
- **Backend as a Service**: Firebase (Auth, Firestore, Hosting).
- **IA**: OpenRouter API (Agregador de modelos LLM como Gemini, GPT-4o).
- **Cálculo**: Motores lógicos locales para metabolismo y rutinas.

## 2. Los 12 Pilares de Escalabilidad (Roadmap)

### 1. Load Balancing (Balanceo de Carga)
Actualmente gestionado de forma nativa por **Firebase Hosting** y **Cloud Functions**. A medida que el tráfico crezca, se pueden implementar balanceadores de carga de Google Cloud (GCLB) para distribuir el tráfico entre múltiples regiones.

### 2. Caching (Almacenamiento en Caché)
- **Local**: Uso de `localStorage` para planes de dieta y rutinas actuales para evitar llamadas innecesarias a la API/DB.
- **Backend**: Implementación futura de **Redis** en Cloud Run para cachear respuestas comunes de la IA y perfiles metabólicos de acceso frecuente.

### 3. Content Delivery Networks (CDN)
Los activos estáticos (imágenes, scripts, CSS) se sirven a través de la infraestructura global de **Google CDN**, reduciendo la latencia para usuarios en cualquier parte del mundo.

### 4. Message Queue (Colas de Mensajes)
Integración de **Google Cloud Tasks** para procesar la generación de planes de entrenamiento complejos de forma asíncrona, desacoplando la solicitud del usuario del tiempo de respuesta del modelo de IA.

### 5. Publish-Subscribe (Pub/Sub)
Uso de **Firebase Cloud Messaging (FCM)** para notificar a los usuarios cuando sus análisis de progreso o planes semanales personalizados estén listos después de un procesamiento asíncrono.

### 6. API Gateway
Actualmente OpenRouter actúa como gateway para los LLMs. Se contempla el uso de **Google API Gateway** para centralizar la autenticación, monitoreo y políticas de seguridad antes de llegar a las funciones de backend.

### 7. Circuit Breaker (Disyuntor)
Implementación de lógica defensiva en el frontend (ya iniciada en `mealGenerator.js`) para manejar fallos de la API de IA, permitiendo fallbacks locales y evitando que un fallo externo bloquee la experiencia del usuario.

### 8. Service Discovery
Gestión automatizada a través del ecosistema Firebase/GCP, donde las funciones se descubren y comunican dinámicamente.

### 9. Sharding (Fragmentación de Datos)
Firestore escala horizontalmente de forma automática. Sin embargo, diseñaremos la estructura de subcolecciones para evitar "hotspots" en documentos de usuarios populares (ej. Influencers).

### 10. Rate Limiting (Limitación de Tasa)
Crucial para controlar costos de IA. Implementaremos límites por UID en el backend para prevenir el abuso de la generación de dietas y proteger la cuenta de OpenRouter.

### 11. Consistent Hashing
Aplicable en una fase avanzada de escalado de bases de datos distribuidas o clusters de caché personalizados para asegurar una distribución uniforme de la carga.

### 12. Auto Scaling
Capacidad nativa de **Firebase Functions** y **Cloud Run**, permitiendo que la infraestructura crezca de 0 a miles de instancias instantáneamente según la demanda.

---

## 4. Capacidades de Tráfico y Concurrencia (Estimado Actual)

Con el stack configurado (**Hostinger Business** para el frontend y **Firebase Blaze** para el backend), la aplicación puede manejar:

- **Usuarios Simultáneos (Frontend)**: Estimado de **500 - 1,500 usuarios navegando al mismo tiempo** sin degradación de velocidad. Con la activación de CDN (Cloud Delivery Network), este número escala a decenas de miles.
- **Acciones Simultáneas (Backend - Cloud Functions)**: Hasta **1,000 ejecuciones en el mismo milisegundo**. Esto garantiza que 1,000 usuarios puedan estar pidiendo una dieta a la IA exactamente al mismo tiempo sin colas.
- **Capacidad de Base de Datos (Firestore)**: Hasta **1,000,000 de conexiones simultáneas** y 10,000 escrituras por segundo. 
- **Límite Mensual**: El plan de Hostinger soporta cómodamente ~100,000 visitantes mensuales, pero la lógica de negocio técnica (Firebase) no tiene un límite real bajo el plan Blaze (Pay-as-you-go), escalando infinitamente según el presupuesto.

Este stack permite a los influencers lanzar campañas masivas (tráfico "spike") sin miedo a que la app deje de responder.
