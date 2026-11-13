# ADR 004: Firebase Auth Google & Email Hybrid Strategy

## Estado
Aceptado

## Contexto
Los administradores y bartenders de bares y discotecas requieren métodos de inicio de sesión rápidos, modernos y confiables desde tablets, computadores o dispositivos móviles en barra.

## Decisión
Se implementa una estrategia híbrida con Firebase Authentication:
1. **Google Sign-In (1-Click Popup):** Método primario recomendado para administradores con cuenta de Google/Gmail.
2. **Email & Password:** Método alternativo para personal con correos corporativos o sin cuenta de Google.
3. **Flujo de Recuperación:** Envío de enlaces de restablecimiento de contraseña (`sendPasswordResetEmail`).
4. **Sincronización de Perfil:** El observador `onAuthStateChanged` verifica en cada recarga el documento en `/users/{uid}`, garantizando reactividad inmediata si el Superadmin cambia la empresa o el rol del usuario.

## Consecuencias
- Experiencia de usuario limpia y moderna con Google como estándar.
- Mapeo directo entre el UID de Firebase Authentication y el documento `/users/{uid}` en Cloud Firestore.

