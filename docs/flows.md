# Mapa Conceptual de Flujos - FitAI

Este documento visualiza los flujos principales de la aplicación, desde el aterrizaje del usuario hasta el ciclo de retención y fidelización.

## 1. Flujo de Onboarding y Perfil Metabólico
El usuario ingresa sus datos y obtenemos su firma metabólica única.

```mermaid
graph TD
    A[Inicio: Landing Page] --> B{¿Autenticado?}
    B -- No --> C[Login / Registro Firebase]
    B -- Sí --> D[Dashboard]
    C --> D
    D --> E[Perfil de Usuario]
    E --> F[Ingreso de Datos: Peso, Altura, Edad, Objetivo]
    F --> G[Cálculo Metabólico: TMB, TDEE, Macros]
    G --> H[Guardado en Firestore & LocalStorage]
```

## 2. Ciclo Diario de Nutrición IA
El corazón de la experiencia de usuario personalizada.

```mermaid
graph LR
    A[Sección Nutrición] --> B{¿Plan Existente?}
    B -- No --> C[Generar Dieta con IA]
    C --> D[OpenRouter LLM Processing]
    D --> E[Visualización de Comidas]
    B -- Sí --> E
    E --> F[Registro de Comida / Extras]
    F --> G[Sincronización de Macros en Tiempo Real]
    G --> H[Dashboard: Resumen de Progreso]
```

## 3. Flujo Social y Retención (Gamificación)
Cómo los influencers fitness interactúan con sus seguidores.

```mermaid
graph TD
    A[Influencer publica rutina/progreso] --> B[Sección Social 2.0]
    B --> C[Historias en vivo: Live Training]
    C --> D[Usuario interactúa: Kudos / Comentarios]
    D --> E[Ranking Global / Leaderboard]
    E --> F[Logros y Badges]
    F --> G[Aumento de Retención y DAU]
```

## 4. Flujo de Entrenamiento y Tracking
Sincronización entre el plan y la ejecución.

```mermaid
graph TD
    A[Elegir Rutina] --> B[AI Routine Builder]
    B --> C[Inicio de Entrenamiento]
    C --> D[Registro de Series/Reps]
    D --> E[Análisis de Volumen Semanal]
    E --> F[Historial de Entrenamientos]
    F --> G[Ajuste Dinámico de Calorías por Actividad]
```
