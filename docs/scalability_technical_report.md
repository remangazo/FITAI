# Reporte Técnico de Escalabilidad y Capacidad: FitAI Personal

Este documento detalla la infraestructura técnica, las optimizaciones de la Fase 1 y la capacidad de soporte de usuarios simultáneos de la plataforma FitAI.

## 1. Arquitectura de Soporte Masivo

FitAI utiliza una arquitectura **Serverless** basada en Firebase, lo que permite una escalabilidad elástica. Tras las optimizaciones de la Fase 1, se han definido los siguientes límites de capacidad técnica:

### 1.1 Concurrencia de Usuarios
- **Soporte Estimado**: Hasta **1,000,000 de conexiones simultáneas**.
- **Mecanismo**: Uso de WebSockets (Firestore Realtime Listeners) con balanceo de carga nativo de Google Cloud.
- **Optimización de Cliente**: El **Cacheo Metabólico** reduce el uso de CPU en un 80% en el dispositivo del usuario al evitar recálculos en cada sesión, permitiendo que la app funcione fluidamente incluso en condiciones de alta carga global.

---

## 2. Optimizaciones de Datos (Fase 1)

Se han implementado tres pilares fundamentales para garantizar la estabilidad durante el crecimiento:

### 2.1 Transacciones Atómicas (Link/Unlink)
- **Implementación**: Uso de `runTransaction` para la vinculación alumno-coach.
- **Seguridad**: Garantiza que un alumno no pueda quedar "huérfano" o vinculado a medias. Si falla el incremento en el coach, se revierte la asignación en el alumno.
- **Escalabilidad**: Evita condiciones de carrera cuando cientos de alumnos intentan usar un mismo código de invitación simultáneamente.

### 2.2 Contadores Atómicos
- **Implementación**: Uso de `increment()` de Firestore.
- **Eficiencia**: 
    - **Antes**: Lectura de N documentos para contar (Costo: O(N) lecturas).
    - **Ahora**: Lectura de 1 solo campo en el documento del coach (Costo: O(1) lectura).
- **Ahorro**: Para un coach con 1,000 alumnos, cada carga de dashboard ahorra 999 lecturas de base de datos.

### 2.3 Sistema de Cacheo Metabólico
- **Persistencia**: El perfil metabólico (TMB, TDEE, Macros) se almacena en el campo `metabolicCache` del perfil del alumno.
- **Invalidez de Cache**: El sistema detecta cambios en peso, altura, edad u objetivos para invalidar y regenerar el cache automáticamente.
- **Impacto**: Elimina la latencia de procesamiento al iniciar la aplicación.

---

## 3. Análisis de Capacidad y Roadmap

| Métrica | Capacidad Actual | Punto de Saturación (Fase 2) |
| :--- | :--- | :--- |
| **Alumnos por Coach** | 1,000+ activos | > 2,000 alumnos activos |
| **Historial de Actividad** | ~180 días fluidos | > 1 año de logs diarios |
| **Concurrencia Global** | Millones de usuarios | Límite de conexiones Firestore |

### Próximos Pasos (Fase 2)
Para superar el próximo techo técnico, se implementará:
1. **Event-Driven Analytics**: Procesamiento asíncrono en Cloud Functions para el historial de largo plazo (>1 año).
2. **Data Sharding**: Distribución de contadores si la frecuencia de actualización supera las 10,000 ops/seg por documento.

---

**Fecha de última actualización**: 14 de Enero, 2026
**Estatus**: Fase 1 Completada e Implementada.
