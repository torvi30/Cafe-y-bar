# ADR 003: Unassigned User Gatekeeper (Bloqueo de Usuarios Sin Asignar)

## Estado
Aceptado

## Contexto
Cualquier persona puede registrarse en la plataforma utilizando autenticación con Google o Correo/Contraseña. Sin embargo, no se debe permitir que un usuario recién registrado acceda al POS, ni cree empresas por su cuenta, ni altere datos comerciales.

## Decisión
Se implementa una compuerta estricta (Gatekeeper) en el flujo de autenticación y enrutamiento:
1. Al crear una cuenta (sea con Google o Email), el documento del usuario en `/users/{uid}` se inicializa con:
   ```json
   {
     "uid": "user_id",
     "email": "persona@gmail.com",
     "role": "user",
     "companyId": null,
     "createdAt": "serverTimestamp()"
   }
   ```
2. Si `user.role !== 'superadmin'` y `user.companyId === null`:
   - El enrutador intercepta la sesión y redirige inmediatamente a la vista `UnassignedUserView`.
   - El usuario ve únicamente un mensaje informativo:
     > *"Tu cuenta ha sido creada exitosamente. Tu acceso se encuentra pendiente de asignación. Por favor contacta al Super Administrador para que vincule tu usuario a una empresa."*
   - No se renderiza la barra lateral, ni el catálogo, ni el POS, ni la facturación.
3. Solo el Superadmin, desde la Consola Maestra (`/admin/users`), puede seleccionar a este usuario y asignarlo a una empresa existente con el rol adecuado (`admin` u `operador`).

## Consecuencias
- Auto-registro seguro sin riesgo de intrusión.
- Control total de licencias y acceso en manos del dueño del SaaS.

