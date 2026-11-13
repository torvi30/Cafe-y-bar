# ADR 001: Role-Based Access Control (RBAC) - Superadmin & Tenant Admin

## Estado
Aceptado

## Contexto
El sistema POS y Facturación Electrónica opera bajo un modelo SaaS multi-tenant donde conviven dos niveles de administración:
1. **Super Administrador de la Plataforma (Superadmin):** Posee control global sobre la infraestructura, creación de empresas/tenants, facturación recurrente (MRR), activación de Feature Flags y asignación de usuarios a las empresas.
2. **Administrador de Empresa (Admin):** Administra exclusivamente la operación, productos, precios, turnos de caja, inventario y facturación DIAN de su empresa asignada (`companyId`).
3. **Operador / Cajero (User):** Personal operativo asignado a una empresa que solo interactúa con el POS de barra rápida.

## Decisión
Se definen los roles estrictos:
```typescript
export type Role = 'superadmin' | 'admin' | 'user';
```
- La lista `PLATFORM_SUPERADMIN_EMAILS` define los correos con autoridad absoluta sobre la plataforma (ej. `victortamayopine@gmail.com`, `victortamayopinc@gmail.com`, `danielb.alzate1@gmail.com`).
- Cuando un usuario inicia sesión con uno de estos correos, su perfil se aprovisiona o eleva automáticamente con rol `superadmin` y `companyId: null`.
- Un usuario normal creado por registro público inicia con `role: 'user'` y `companyId: null` (sin empresa asignada).

## Consecuencias
- Seguridad hermética: ningún usuario no asignado puede acceder a datos comerciales ni operar un POS.
- Solo el Superadmin puede crear empresas y vincular usuarios a una empresa.

