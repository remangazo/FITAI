# Auditoría de Seguridad y Tecnología - FitAI

Este documento presenta una evaluación de la postura de seguridad actual y las recomendaciones tecnológicas para garantizar la integridad y privacidad de los datos de los usuarios.

## 1. Auditoría de Seguridad Actual

### Gestión de Identidad (Auth)
- **Implementación**: Firebase Authentication (OAuth 2.0).
- **Fortalezas**: Manejo de tokens JWT seguro, soporte para MFA (Multi-Factor Authentication), sesión gestionada por Google.
- **Punto de Mejora**: Implementar auditoría de logs de inicio de sesión para detectar comportamientos anómalos.

### Capa de Datos (Database)
- **Tecnología**: Firestore.
- **Seguridad**: Reglas de seguridad basadas en el `request.auth.uid`.
- **Estatus**: Se ha verificado que solo los propietarios de la cuenta pueden leer/escribir sus datos metabólicos y dietas.
- **Recomendación**: Realizar auditorías periódicas de las reglas de seguridad con `firebase_validate_security_rules`.

### Protección de Secrets (API Keys)
- **Riesgo**: Exposición de la clave de OpenRouter en el cliente.
- **Estado Actual**: **PROTEGIDO**. Todas las llamadas se realizan a través de un proxy seguro en Cloud Functions.
- **Acción Realizada**: Se migró `mealGenerator.js` y otros servicios para eliminar el uso de API keys en el frontend.

---

## 2. Mejores Prácticas de Seguridad Integradas

### Inyección y Validación
- Uso de **Services** dedicados para la sanitización de inputs antes de enviarlos a la IA o guardarlos en la base de datos (Ej: `validationService.js`).

### Encriptación
- Datos en tránsito: HTTPS/TLS forzado en Firebase Hosting.
- Datos en reposo: Encriptación AES-256 nativa de Google Cloud para Firestore.

---

## 3. Plan de Auditoría Tecnológica (Q1-Q2)

| Área | Acción | Prioridad | Estado |
| :--- | :--- | :--- | :--- |
| **API Management** | Migración a Backend (Cloud Functions) | **Crítica** | **COMPLETO** |
| **Escalabilidad** | Implementar Redis para caché de planes | Alta | Pendiente |
| **Privacidad** | Auditoría de cumplimiento GDPR/LGPD | Media | Pendiente |
| **Monitoreo** | Configurar alertas de presupuesto en GCP y OpenRouter | Alta | Pendiente |

---

## 4. Auditoría de Escalabilidad (Basada en ByteByteGo)
Hemos alineado nuestra infraestructura con los patrones de diseño modernos:
- **Resiliencia**: Uso de Circuit Breakers lógicos para fallos de IA.
- **Disponibilidad**: CDN global para la Web App.
- **Auto-Scaling**: Arquitectura Serverless que escala según demanda real.
