# Sistema POS & Facturación Electrónica DIAN Multi-tenant Modular
## Arquitectura para Bares y Discotecas con Feature Flags

Este proyecto implementa una arquitectura SaaS Full-Stack **Multi-tenant** altamente modular para bares, discotecas y gastrobares en Colombia, construida con **React, Node.js y Google Cloud Firestore**.

El sistema permite adaptar las capacidades de software según el perfil contratado por cada bar mediante **Feature Flags por Tenant**, permitiendo desde clientes que solo necesitan emitir facturas DIAN rápidamente en barra sin lidiar con inventarios, hasta grandes discotecas con control de bodegas y comandas por mesa.

---

## 🏛️ Estructura del Proyecto

```text
cafe y bar/
├── firestore.rules               # Reglas de seguridad jerárquicas multi-tenant con validación de flags
├── firestore.indexes.json        # Índices compuestos para Firestore
├── package.json                  # Scripts globales de ejecución
├── README.md                     # Documentación técnica y de despliegue
│
├── backend/                      # API Node.js / Express con TypeScript
│   ├── src/
│   │   ├── config/               # Inicialización de Firebase Admin SDK
│   │   ├── middleware/           # tenantContextMiddleware y requireFeature()
│   │   ├── routes/               # Checkout, Productos e Inventario, Tenant Settings
│   │   ├── services/
│   │   │   ├── checkout.service.ts      # Pipeline transaccional condicional
│   │   │   ├── dianNumbering.service.ts # Consecutivos DIAN atómicos sin huecos
│   │   │   ├── dianCufe.service.ts      # Algoritmo SHA-384 CUFE y QR
│   │   │   └── dianQueue.service.ts     # Cola asíncrona de transmisión UBL 2.1
│   │   ├── types/                # Modelos de Tenant, Order, Product
│   │   └── server.ts             # Servidor Express
│   └── package.json
│
└── frontend/                     # Aplicación React + TypeScript + Tailwind
    ├── src/
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── FeatureGate.tsx     # <FeatureGate feature="..."> declarativo
    │   │   │   └── FeatureRoute.tsx    # Guardia de rutas protegidas
    │   │   ├── layout/                 # Layout y AppSidebar dinámico
    │   │   └── pos/                    # ProductCard, QuickCart, FastPayButtons
    │   ├── context/
    │   │   └── TenantConfigContext.tsx # Provider con reactividad en tiempo real
    │   ├── store/
    │   │   └── posStore.ts             # Estado local ultra liviano (Zustand)
    │   ├── views/
    │   │   ├── QuickPosView.tsx        # MÓDULO BASE: POS Barra Rápida (1-Tap)
    │   │   ├── DianInvoicesView.tsx    # MÓDULO BASE: Facturación Electrónica DIAN
    │   │   ├── InventoryView.tsx       # MÓDULO CONDICIONAL: Stock y Bodega
    │   │   ├── TableTabsView.tsx       # MÓDULO CONDICIONAL: Mesas y Cuentas Abiertas
    │   │   └── SettingsView.tsx        # Panel en caliente de Feature Flags
    │   ├── App.tsx                     # Enrutador principal y configuración de Providers
    │   └── main.tsx
    ├── vite.config.ts
    └── package.json
```

---

## ⚙️ 1. Configuración por Tenant (Firestore)

Cada establecimiento tiene un documento de configuración en la ruta:
`/tenants/{tenantId}/config/settings`

### Esquema del Documento:
```json
{
  "tenantId": "bar-babylon-bogota",
  "businessName": "Discoteca Babylon Bogotá S.A.S.",
  "nit": "901.458.963-2",
  "features": {
    "inventoryEnabled": false,       // true: descuenta stock; false: venta libre sin rastro de stock
    "tableTabsEnabled": false,       // true: gestión de mesas y cuentas abiertas
    "quickPosOnly": true,            // true: interfaz minimalista de barra a 1-tap
    "electronicInvoicing": true,     // Motor fiscal DIAN activo
    "propinaSugeridaEnabled": true   // 10% voluntario en barra
  },
  "dianConfig": {
    "resolutionNumber": "18764000001",
    "prefix": "SETT",
    "rangeFrom": 1,
    "rangeTo": 50000,
    "currentNumber": 1420,
    "technicalKey": "fc8aacda93d8429b6e",
    "environment": "2",              // 1: Producción, 2: Pruebas
    "taxRegime": "RESPONSABLE_IMPOCONSUMO_8"
  }
}
```

---

## ⚡ 2. Módulos Base (Siempre Activos)

1. **POS Barra Rápida (`QuickPosView`):**
   - Diseñado para pantallas táctiles de discotecas con alto ruido y baja iluminación.
   - Cobro a 1 o 2 toques con botones predefinidos de Efectivo, Datáfono y Transferencia (Nequi/Daviplata).
   - Liquidación automática de Impuesto Nacional al Consumo (8%) o IVA (19%).

2. **Motor de Facturación Electrónica DIAN (`DianInvoicesView`):**
   - Generación atómica del número consecutivo (`SETT-1421`) sin saltos ni duplicados (`dianNumbering.service.ts`).
   - Algoritmo canónico SHA-384 para generación inmediata de **CUFE** según el Anexo Técnico 1.9 (`dianCufe.service.ts`).
   - Cola asíncrona de transmisión al Web Service SOAP de la DIAN (`dianQueue.service.ts`) para que el cajero imprima la tirilla en menos de 200 milisegundos sin depender del tiempo de respuesta del servidor del Estado.

---

## 📦 3. Módulo Condicional de Inventario (`inventoryEnabled`)

### Comportamiento cuando `inventoryEnabled: false`
* El cliente solo quiere facturar legalmente y despachar botellas sin controlar existencias.
* En el frontend:
  * Se suprimen las insignias de stock, advertencias de agotado y costos en `<ProductCard />`.
  * La opción **Stock & Bodega** desaparece automáticamente del menú lateral (`AppSidebar`).
  * Si un usuario intenta acceder manualmente a `/inventario`, el componente `FeatureRoute` lo redirige de inmediato a `/pos`.
* En el backend:
  * El servicio `CheckoutService` hace un **bypass total** de consultas y bloqueos de stock, permitiendo facturar a velocidad pura.

### Comportamiento cuando `inventoryEnabled: true`
* Se desbloquea la vista de **Stock & Bodega** (`/inventario`).
* En cada venta, una transacción atómica en Firestore valida las existencias físicas y descuenta las botellas o tragos vendidos.
* Si el stock llega al umbral de seguridad (`minStockAlert`), el sistema emite alertas visuales de reposición inmediata.

---

## 🍹 4. Módulo Condicional de Mesas y Cuentas Abiertas (`tableTabsEnabled`)

* Si está activo, permite gestionar comandas acumuladas por mesa o tab de barra antes de facturar.
* Si está inactivo, el sistema opera exclusivamente en modo barra directa sin fricción.

---

## 🚀 5. Cómo Ejecutar el Proyecto

### Prerrequisitos:
* Node.js v18+ o v20+ instalado.

### Instalación de dependencias:

```bash
# Instalar dependencias del Backend
cd backend
npm install

# Instalar dependencias del Frontend
cd ../frontend
npm install
```

### Ejecución en Desarrollo:

```bash
# Terminal 1: Backend API (Puerto 4000)
cd backend
npm run dev

# Terminal 2: Frontend Vite (Puerto 3000)
cd frontend
npm run dev
```

Abre tu navegador en `http://localhost:3000` y dirígete a la sección **⚙️ Config & Flags** para probar los interruptores en vivo.

