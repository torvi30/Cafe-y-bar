# ADR 002: Strict Multi-Tenancy Data Isolation (Aislamiento Estricto por Tenant)

## Estado
Aceptado

## Contexto
En un entorno SaaS donde múltiples discotecas, bares y restaurantes compiten y gestionan información fiscal sensible (resoluciones DIAN, ventas, costos, inventario), la filtración cruzada de datos entre empresas es inadmisible.

## Decisión
Se implementa una arquitectura híbrida de aislamiento en Cloud Firestore:
1. **Colección Global de Empresas:** `/companies/{companyId}`
   - Almacena datos comerciales, fiscales DIAN, estado de suscripción (`status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED'`) y Feature Flags (`features`).
2. **Colección Global de Usuarios:** `/users/{uid}`
   - Cada perfil almacena su pertenencia estricta mediante `companyId: string | null`.
   - Toda consulta operativa debe filtrar obligatoriamente por `where('companyId', '==', companyId)`.
3. **Subcolecciones Aisladas por Empresa:**
   - `/companies/{companyId}/products/{productId}`
   - `/companies/{companyId}/orders/{orderId}`
   - `/companies/{companyId}/invoices/{invoiceId}`
   - `/companies/{companyId}/shifts/{shiftId}`
   - `/companies/{companyId}/inventory/{itemId}`

## Consecuencias
- Cero posibilidad de colisión de consecutivos de facturas DIAN entre bares.
- Si un usuario no pertenece a la empresa `A`, las reglas de seguridad de Firestore y el frontend le deniegan cualquier lectura o escritura en `/companies/A/...`.

